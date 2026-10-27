// Local cross-tab logout and real QA-session expiry checks. Only the temporary
// QA user's session deadline is shortened. No existing account/session changes.
// disableRefresh is added to QA get-session requests so the server does not
// automatically extend that deliberately short deadline. Responses are not faked.
// UI_SMOKE_CREATE_TEMP_ADMIN=1 bun scripts/browser_expiry_smoke.mjs
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { connectBrowserPage } from "./lib/browser_cdp.mjs";

assert.equal(process.env.UI_SMOKE_CREATE_TEMP_ADMIN, "1", "Temporary account creation requires explicit opt-in");
const base = new URL(process.env.UI_SMOKE_BASE_URL ?? "http://localhost:2703");
assert(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Local application hosts only");
const debuggerUrl = process.env.UI_SMOKE_DEBUG_URL ?? "http://127.0.0.1:9333";
const prisma = new PrismaClient();
const id = randomUUID();
const email = `ui-qa-${id}@example.invalid`;
const password = randomBytes(32).toString("base64url");
let first;
let second;
let created = false;
async function signIn(page) {
  const response = await fetch(new URL("/api/auth/sign-in/email", base), {
    method: "POST", headers: { "content-type": "application/json", origin: base.origin },
    body: JSON.stringify({ email, password }), signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200);
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";", 1)[0];
    const equals = pair.indexOf("=");
    await page.send("Network.setCookie", { name: pair.slice(0, equals), value: pair.slice(equals + 1), url: base.origin, httpOnly: true });
  }
  await response.body?.cancel();
}
async function prime(page) {
  await page.send("Network.setBlockedURLs", { urls: [`${base.origin}/api/sister/file/*`] });
  await page.send("Page.bringToFront");
  await page.send("Page.navigate", { url: new URL("/referensi/agama", base).href });
  await page.waitFor("document.querySelectorAll('main tbody tr').length > 0 && !!document.querySelector('header form[role=search]')", "ADMIN reference cache primed");
  await page.evaluate("window.__qaSameDocument = true");
}
async function waitUntil(predicate, label, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${label}`);
}
try {
  assert.equal((await fetch(new URL("/login", base))).status, 200);
  first = await connectBrowserPage(debuggerUrl);
  second = await connectBrowserPage(debuggerUrl);
  await prisma.appUser.create({ data: {
    id, email, name: "Temporary Session QA", role: "ADMIN", isActive: true, emailVerified: true,
    authAccounts: { create: { id: randomUUID(), accountId: id, providerId: "credential", password: await hashPassword(password) } },
  } });
  created = true;
  await signIn(first);
  await prime(first);
  await prime(second);
  await first.send("Page.bringToFront");
  assert(await second.evaluate("document.querySelectorAll('main tbody tr').length > 0"));
  await first.evaluate("document.querySelector('button[aria-label=Keluar]').click()");
  await first.waitFor("location.pathname === '/login' && !!document.querySelector('#login-email')", "first-tab logout");
  // Do not focus or reload the second tab: broadcast-driven invalidation only.
  await second.waitFor("document.querySelectorAll('main tbody tr').length === 0 && !document.querySelector('header form[role=search]')", "other tab clears previous data");
  assert(await second.evaluate("window.__qaSameDocument === true"));
  assert.equal(await second.evaluate("fetch('/api/trpc/overview.session').then(r=>r.status)"), 401);
  assert.equal(second.exceptions.length, 0);
  assert.equal(second.eventErrors.length, 0);
  console.log(JSON.stringify({ check: "cross-tab-logout-clears-restricted-cache", secondTabReloaded: false, passed: true }));
  await second.close(); second = null;

  await signIn(first);
  await prime(first);
  await first.send("Network.setCacheDisabled", { cacheDisabled: true });
  let expectedExpiry = null;
  let observedExpiry = null;
  let sessionReads = 0;
  let observedAnonymous = false;
  const sessionResponses = new Set();
  first.onEvent(async message => {
    if (message.method === "Fetch.requestPaused") {
      const url = new URL(message.params.request.url);
      url.searchParams.set("disableRefresh", "true");
      await first.send("Fetch.continueRequest", { requestId: message.params.requestId, url: url.href });
      sessionReads += 1;
    }
    if (message.method === "Network.responseReceived" && new URL(message.params.response.url).pathname === "/api/auth/get-session") sessionResponses.add(message.params.requestId);
    if (message.method === "Network.loadingFinished" && sessionResponses.delete(message.params.requestId)) {
      const body = await first.send("Network.getResponseBody", { requestId: message.params.requestId });
      const value = JSON.parse(body.base64Encoded ? Buffer.from(body.body, "base64").toString() : body.body);
      if (value?.session?.expiresAt) observedExpiry = new Date(value.session.expiresAt).getTime();
      if (!value?.session) observedAnonymous = true;
    }
  });
  await first.send("Fetch.enable", { patterns: [{ urlPattern: `${base.origin}/api/auth/get-session*`, requestStage: "Request" }] });
  const session = await prisma.authSession.findFirst({ where: { userId: id }, orderBy: { createdAt: "desc" }, select: { id: true } });
  assert(session, "Temporary session required");
  expectedExpiry = Date.now() + 6000;
  await prisma.authSession.update({ where: { id: session.id, userId: id }, data: { expiresAt: new Date(expectedExpiry) } });
  await first.evaluate("document.dispatchEvent(new Event('visibilitychange'))");
  await waitUntil(() => observedExpiry === expectedExpiry, "client receives the real short QA expiry");
  assert(await first.evaluate("document.querySelectorAll('main tbody tr').length > 0"), "Cached rows remain before expiry");
  // No focus, navigation or forced API read at the deadline: the boundary's
  // own expiry timer must hide cached content and revalidate the session.
  await first.waitFor("document.querySelectorAll('main tbody tr').length === 0 && !document.querySelector('header form[role=search]')", "idle expiry clears cached content", 15000);
  await waitUntil(() => observedAnonymous, "expired session is revalidated as anonymous");
  assert(await first.evaluate("window.__qaSameDocument === true"));
  assert.equal(await first.evaluate("fetch('/api/trpc/overview.session').then(r=>r.status)"), 401);
  assert(sessionReads >= 1);
  assert.equal(first.exceptions.length, 0);
  assert.equal(first.eventErrors.length, 0);
  console.log(JSON.stringify({ check: "idle-real-session-expiry-clears-restricted-cache", responseForged: false, documentReloaded: false, passed: true }));
} finally {
  if (second) await second.close();
  if (first) await first.close();
  try {
    if (created) await prisma.appUser.delete({ where: { id } });
    console.log(JSON.stringify({ cleanup: "temporary account, credentials and sessions removed; audits retained" }));
  } finally { await prisma.$disconnect(); }
}
