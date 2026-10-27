// Same-document account-switch QA. No reload between ADMIN logout and VIEWER
// login: this exercises the shared browser query cache while it is still fresh.
// Only non-personal religion reference data is displayed; no payload/credentials
// are printed or saved. Both temporary accounts are removed in finally.
// UI_SMOKE_CREATE_TEMP_ADMIN=1 bun scripts/browser_session_smoke.mjs
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

assert.equal(process.env.UI_SMOKE_CREATE_TEMP_ADMIN, "1", "Temporary account creation requires explicit opt-in");
const base = new URL(process.env.UI_SMOKE_BASE_URL ?? "http://localhost:2703");
const debuggerUrl = process.env.UI_SMOKE_DEBUG_URL ?? "http://127.0.0.1:9333";
for (const url of [base.href, debuggerUrl]) assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname), "Local hosts only");
const prisma = new PrismaClient();
const accounts = ["ADMIN", "VIEWER"].map(role => {
  const id = randomUUID();
  return { id, role, email: `ui-qa-${id}@example.invalid`, password: randomBytes(32).toString("base64url") };
});
let target;
let ws;
let sequence = 0;
const calls = new Map();
const exceptions = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { calls.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    calls.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  assert(!response.exceptionDetails, "Browser expression failed");
  return response.result.value;
}
async function waitFor(expression, label) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${label}`);
}
async function fillLogin(account) {
  await evaluate("document.querySelector('#login-email').focus()");
  await send("Input.insertText", { text: account.email });
  await evaluate("document.querySelector('#login-password').focus()");
  await send("Input.insertText", { text: account.password });
}
const fileBlock = `${base.origin}/api/sister/file/*`;
try {
  assert.equal((await fetch(new URL("/login", base), { signal: AbortSignal.timeout(15000) })).status, 200);
  target = await (await fetch(`${debuggerUrl}/json/new?about:blank`, { method: "PUT" })).json();
  for (const account of accounts) {
    await prisma.appUser.create({ data: {
      id: account.id, email: account.email, name: `Temporary ${account.role} QA`, role: account.role, isActive: true, emailVerified: true,
      authAccounts: { create: { id: randomUUID(), accountId: account.id, providerId: "credential", password: await hashPassword(account.password) } },
    } });
  }
  const login = await fetch(new URL("/api/auth/sign-in/email", base), {
    method: "POST", headers: { "content-type": "application/json", origin: base.origin },
    body: JSON.stringify({ email: accounts[0].email, password: accounts[0].password }), signal: AbortSignal.timeout(15000),
  });
  assert.equal(login.status, 200, "Initial ADMIN sign-in required");
  const cookies = login.headers.getSetCookie();
  await login.body?.cancel();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") exceptions.push("uncaught exception");
    if (!message.id) return;
    const call = calls.get(message.id);
    if (!call) return;
    calls.delete(message.id); clearTimeout(call.timer);
    if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result);
  });
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  await send("Network.setBlockedURLs", { urls: [fileBlock] });
  for (const cookie of cookies) {
    const pair = cookie.split(";", 1)[0];
    const equals = pair.indexOf("=");
    await send("Network.setCookie", { name: pair.slice(0, equals), value: pair.slice(equals + 1), url: base.origin, httpOnly: true });
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.bringToFront");
  await send("Page.navigate", { url: new URL("/referensi/agama", base).href });
  await waitFor("document.querySelectorAll('main tbody tr').length > 0 && document.querySelector('button[aria-label=Keluar]')", "ADMIN reference data primed");
  const primedAt = Date.now();
  await evaluate("window.__qaSameDocument = true; history.pushState(null, '', '/referensi/agama?qa_history=1')");

  // Failed sign-out must not pretend the session has ended or strand controls.
  await send("Network.setBlockedURLs", { urls: [fileBlock, `${base.origin}/api/auth/sign-out`] });
  await evaluate("document.querySelector('button[aria-label=Keluar]').click()");
  await waitFor("document.querySelector('[role=alert]') && !document.querySelector('button[aria-label=Keluar]').disabled", "sign-out network failure is recoverable");
  assert(await evaluate("location.pathname === '/referensi/agama' && document.querySelectorAll('main tbody tr').length > 0"), "Failed logout must not falsely navigate to login");

  await send("Network.setBlockedURLs", { urls: [fileBlock] });
  await evaluate("document.querySelector('button[aria-label=Keluar]').click()");
  await waitFor("location.pathname === '/login' && document.querySelector('#login-email')", "successful UI logout");
  assert(await evaluate("document.querySelectorAll('main tbody tr').length === 0"), "Logout removes prior table data");
  assert(await evaluate("window.__qaSameDocument === true"), "Logout uses the same browser document/cache context");
  await evaluate("history.replaceState(null, '', '/login?next=%2Freferensi%2Fagama')");
  await fillLogin(accounts[1]);
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("location.pathname === '/referensi/agama' && !document.querySelector('[aria-busy=true]') && document.querySelector('main')?.innerText.includes('ADMIN')", "VIEWER gets permission denial, not ADMIN cache");
  assert(Date.now() - primedAt < 60000, "Account-switch check must finish inside the old 60-second cache freshness window");
  assert(await evaluate("window.__qaSameDocument === true"), "No full reload may hide the cache-isolation regression");
  assert(await evaluate("document.querySelectorAll('main tbody tr').length === 0 && !document.querySelector('header form[role=search]')"), "VIEWER must never see previous ADMIN rows or header search");
  const transport = await evaluate("fetch('/api/trpc/overview.session', {cache:'no-store'}).then(async r=>({cacheControl:r.headers.get('cache-control'),role:(await r.json()).result.data.role}))");
  assert.equal(transport.role, "VIEWER");
  assert(transport.cacheControl?.includes("private") && transport.cacheControl?.includes("no-store"), "Authenticated DTOs must not enter HTTP caches");
  assert.equal(await evaluate("fetch('/api/trpc/business.modules').then(r=>r.status)"), 403);
  await evaluate("history.back()");
  await waitFor("location.pathname === '/referensi/agama' && document.querySelectorAll('main tbody tr').length === 0", "Back cannot restore prior ADMIN table data");

  await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
  await evaluate("document.querySelector('button[aria-label=Keluar]').click()");
  await waitFor("location.pathname === '/login' && document.querySelector('#login-email') && document.documentElement.classList.contains('dark')", "VIEWER logout");
  assert(await evaluate("document.documentElement.scrollWidth <= innerWidth && getComputedStyle(document.querySelector('#login-email')).backgroundColor !== 'rgb(255, 255, 255)'"), "Login form remains themed and contained at 320px");
  assert(await evaluate("document.querySelector('#login-password').value === ''"), "Login passwords do not survive completed session transitions");
  // A failed network login must release the submitting state without logging secrets.
  await send("Network.setBlockedURLs", { urls: [fileBlock, `${base.origin}/api/auth/sign-in/email`] });
  await fillLogin(accounts[0]);
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("document.querySelector('[role=alert]') && !document.querySelector('button[type=submit]').disabled", "login network failure is recoverable");
  assert.equal(exceptions.length, 0, "Expected fetch failures are handled, not uncaught");
  console.log(JSON.stringify({ check: "same-document-logout-account-switch-cache-isolation", roles: 2, insideFreshCacheWindow: true, backDoesNotRestoreRows: true, networkFailureRecovery: true, passed: true }));
} finally {
  if (ws) ws.close();
  if (target) await fetch(`${debuggerUrl}/json/close/${target.id}`).catch(() => {});
  try {
    await prisma.appUser.deleteMany({ where: { id: { in: accounts.map(account => account.id) } } });
    console.log(JSON.stringify({ cleanup: "temporary accounts, credentials and sessions removed; audits retained" }));
  } finally { await prisma.$disconnect(); }
}
