// Opt-in authenticated local QA. Creates a unique temporary ADMIN/account,
// signs in normally, and removes that user and its sessions in finally.
// Generated password/cookies and personal table content are never printed.
// Audit events are retained. Never use a personal Chrome profile.
// Server: APP_URL=http://localhost:2703 APP_ALLOWED_ORIGINS=http://localhost:2703 next start --port 2703
// UI_SMOKE_CREATE_TEMP_ADMIN=1 bun scripts/browser_admin_smoke.mjs
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { jelajahModules } from "../src/modules/jelajah/api/jelajah_catalog.ts";

assert.equal(process.env.UI_SMOKE_CREATE_TEMP_ADMIN, "1", "Explicit opt-in is required to create and clean up a local QA account");
const base = new URL(process.env.UI_SMOKE_BASE_URL ?? "http://localhost:2703");
const debuggerUrl = process.env.UI_SMOKE_DEBUG_URL ?? "http://127.0.0.1:9333";
for (const url of [base.href, debuggerUrl]) assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname), "Local hosts only");
const prisma = new PrismaClient();
const userId = randomUUID();
const email = `ui-qa-${userId}@example.invalid`;
const password = randomBytes(32).toString("base64url");
let target;
let ws;
let created = false;
let sequence = 0;
const pending = new Map();
const exceptions = [];
const apiErrors = [];
let pausedFileRequest;
let pausedFileNetworkId;
let canceledFile = false;
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  assert(!response.exceptionDetails, "Browser evaluation failed");
  return response.result.value;
}
async function waitFor(expression, label) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    // Return a boolean, not a DOM node that CDP cannot serialize by value.
    if (await evaluate(`Boolean(${expression})`)) return;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error(`Timed out: ${label}`);
}
async function navigate(path, label = "menu target") {
  // Keep the multi-page suite below the production API budget (120/min).
  await new Promise(resolve => setTimeout(resolve, Math.max(0, 2500 - (Date.now() - lastNavigationAt))));
  lastNavigationAt = Date.now();
  await send("Page.navigate", { url: new URL(path, base).href });
  await waitFor(`location.pathname === ${JSON.stringify(new URL(path, base).pathname)} && document.readyState === 'complete' && !!document.querySelector('main') && !!document.querySelector('aside nav a[aria-current="page"]') && !document.querySelector('[aria-busy="true"]')`, `page ready: ${label}`);
  await new Promise(resolve => setTimeout(resolve, 200));
}
const fits = "document.documentElement.scrollWidth <= innerWidth";
const childPagesOnly = process.env.UI_SMOKE_CHILD_PAGES_ONLY === "1";
const detailsOnly = process.env.UI_SMOKE_DETAILS_ONLY === "1" || childPagesOnly;
const downloadsOnly = process.env.UI_SMOKE_DOWNLOADS_ONLY === "1";
let lastNavigationAt = 0;
try {
  // Refuse to create an account if the browser/server is not running.
  assert.equal((await fetch(new URL("/login", base), { signal: AbortSignal.timeout(10000) })).status, 200);
  target = await (await fetch(`${debuggerUrl}/json/new?about:blank`, { method: "PUT" })).json();
  await prisma.appUser.create({ data: {
    id: userId, email, name: "Temporary UI QA", role: "ADMIN", isActive: true, emailVerified: true,
    authAccounts: { create: { id: randomUUID(), accountId: userId, providerId: "credential", password: await hashPassword(password) } },
  } });
  created = true;
  const login = await fetch(new URL("/api/auth/sign-in/email", base), {
    method: "POST", headers: { "content-type": "application/json", origin: base.origin },
    body: JSON.stringify({ email, password }), redirect: "manual", signal: AbortSignal.timeout(15000),
  });
  assert.equal(login.status, 200, "Normal email/password sign-in must succeed");
  const cookies = login.headers.getSetCookie();
  await login.body?.cancel();
  assert(cookies.length > 0, "Sign-in must issue a session cookie");
  const cookieHeader = cookies.map(cookie => cookie.split(";", 1)[0]).join("; ");
  const dashboardResponse = await fetch(new URL("/api/trpc/replika.dashboard", base), { headers: { cookie: cookieHeader }, signal: AbortSignal.timeout(15000) });
  assert.equal(dashboardResponse.status, 200);
  const dashboard = (await dashboardResponse.json()).result.data;
  assert(dashboard.sdm && dashboard.coverage && dashboard.luaran && dashboard.bkd, "Cached dashboard sections must contain data, not silently degrade after SQL errors");
  console.log(JSON.stringify({ check: "dashboard-aggregate-sections", available: true }));
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") exceptions.push("uncaught exception");
    if (message.method === "Fetch.requestPaused") { pausedFileRequest = message.params.requestId; pausedFileNetworkId = message.params.networkId; }
    if (message.method === "Network.loadingFailed" && message.params.requestId === pausedFileNetworkId && message.params.canceled) canceledFile = true;
    if (message.method === "Network.responseReceived") {
      const { url, status } = message.params.response;
      if (url.includes("/api/trpc/") && status >= 400) apiErrors.push({ procedure: new URL(url).pathname, status });
    }
    if (!message.id) return;
    const call = pending.get(message.id);
    if (!call) return;
    pending.delete(message.id); clearTimeout(call.timer);
    if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result);
  });
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  // Prevent browser QA from fetching any upstream photo or binary file.
  await send("Network.setBlockedURLs", { urls: [`${base.origin}/api/sister/file/*`] });
  for (const cookie of cookies) {
    const pair = cookie.split(";", 1)[0];
    const equals = pair.indexOf("=");
    await send("Network.setCookie", { name: pair.slice(0, equals), value: pair.slice(equals + 1), url: base.origin, httpOnly: true });
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.bringToFront");
  if (downloadsOnly) {
    await send("Page.setDownloadBehavior", { behavior: "deny" });
    const documents = await prisma.$queryRawUnsafe(
      `SELECT d.item_key AS id, d.id_sdm AS owner FROM sister_replica_record d
         JOIN sister_replica_record s ON s.integration_id=d.integration_id AND s.endpoint='/referensi/sdm'
          AND s.scope_key='-' AND s.item_key=d.id_sdm AND s.deleted_at IS NULL
        WHERE d.integration_id=$1::uuid AND d.endpoint='/dokumen' AND d.deleted_at IS NULL LIMIT 1`, process.env.SISTER_INTEGRATION_ID,
    );
    assert(documents[0], "A cached document with an active owner is required");
    await navigate(`/dokumen/${encodeURIComponent(documents[0].id)}?id_sdm=${encodeURIComponent(documents[0].owner)}`, "download feedback");
    const action = `document.querySelector('button[data-sister-download]')`;
    await waitFor(`!!${action}`, "download action ready");
    await send("Network.setBlockedURLs", { urls: [`${base.origin}/api/sister/file/foto/*`] });
    // Real server authorization failure, not a forged response. Only this QA
    // user's role changes; the already-rendered button cannot bypass the server.
    await prisma.appUser.update({ where: { id: userId }, data: { role: "VIEWER" } });
    await evaluate(`${action}.click()`);
    await waitFor(`document.querySelector('main [role="alert"]')?.textContent.includes('Role Anda')`, "inline role denial");
    assert(await evaluate(`location.pathname.startsWith('/dokumen/') && document.getElementById(${action}.getAttribute('aria-describedby'))?.getAttribute('role')==='alert'`), "Error stays on the page and describes its button");
    await prisma.appUser.update({ where: { id: userId }, data: { role: "ADMIN" } });
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    await send("Network.setBlockedURLs", { urls: [`${base.origin}/api/sister/file/*`] });
    await evaluate(`${action}.click()`);
    await waitFor(`document.querySelector('main [role="alert"]')?.textContent.includes('Periksa koneksi')`, "offline retry feedback");
    assert(await evaluate(fits), "Download feedback fits 320px");
    await send("Fetch.enable", { patterns: [{ urlPattern: `${base.origin}/api/sister/file/dokumen/*`, requestStage: "Request" }] });
    await send("Network.setBlockedURLs", { urls: [`${base.origin}/api/sister/file/foto/*`] });
    await evaluate(`${action}.click()`);
    await waitFor(`${action}?.disabled && ${action}?.getAttribute('aria-busy')==='true'`, "pending request blocks duplicate clicks");
    for (let i=0; i<30 && !pausedFileRequest; i++) await new Promise(resolve=>setTimeout(resolve,100));
    assert(pausedFileRequest, "File request is held before reaching the server");
    await evaluate(`document.querySelector('a[href="/dokumen"]').click()`);
    await waitFor(`location.pathname==='/dokumen' && !!document.querySelector('main table') && !document.querySelector('[aria-busy="true"]')`, "SPA navigation unmounts pending download");
    for (let i=0; i<30 && !canceledFile; i++) await new Promise(resolve=>setTimeout(resolve,100));
    assert(canceledFile, "Unmount aborts the pending file request");
    await send("Fetch.failRequest", { requestId: pausedFileRequest, errorReason: "Aborted" }).catch(()=>{});
    await send("Fetch.disable");
    assert.equal(exceptions.length, 0);
    assert.deepEqual(apiErrors, []);
    console.log(JSON.stringify({ check: "download-inline-denial-offline-retry-and-unmount-abort", widths: [1280,320], upstreamBinaryRequests: 0, savedToDisk: false, passed: true }));
  } else if (process.env.UI_SMOKE_VISUAL_ONLY === "1") {
    await navigate("/referensi/agama", "header search starting page");
    assert(await evaluate(`document.querySelector('form[role="search"]')?.getAttribute('action') === '/pegawai'`), "Header search is a real directory form");
    await evaluate(`document.querySelector('#global-search').value='SisterbridgeQaNoMatch'; document.querySelector('form[role="search"]').requestSubmit()`);
    await waitFor(`location.pathname === '/pegawai' && new URLSearchParams(location.search).get('search') === 'SisterbridgeQaNoMatch' && document.querySelector('main')?.innerText.includes('0 SDM') && !document.querySelector('[aria-busy="true"]')`, "header search submits a scoped directory filter");
    const screenshots = [];
    async function capture(name) {
      const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      const path = join(tmpdir(), `sister-visual-${name}.png`);
      await writeFile(path, Buffer.from(image.data, "base64"));
      screenshots.push(path);
    }
    for (const width of [1280, 320]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await navigate("/referensi/agama", "non-personal reference visual check");
      for (const scheme of ["light", "dark"]) {
        await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
        await waitFor(`document.documentElement.classList.contains('${scheme}')`, "theme applied");
        await evaluate("document.fonts.ready.then(() => true)");
        await new Promise(resolve => setTimeout(resolve, 250));
        assert(await evaluate(fits), "Reference visual sample must fit the viewport");
        if (width === 1280) {
          await waitFor(`(() => { const a=document.querySelector('aside nav a[aria-current="page"]'); const n=a?.closest('nav'); if(!a||!n)return false; const r=a.getBoundingClientRect(), b=n.getBoundingClientRect(); return r.top>=b.top && r.bottom<=b.bottom; })()`, "active desktop navigation stays visible");
        }
        await capture(`${scheme}-${width}`);
        if (width === 320) {
          await evaluate(`document.querySelector('button[aria-label="Buka navigasi"]').focus(); document.querySelector('button[aria-label="Buka navigasi"]').click()`);
          await waitFor(`!!document.querySelector('[role="dialog"]')`, "visual mobile sidebar");
          assert(await evaluate(`(() => { const t=document.querySelector('button[aria-expanded]'); const r=t.getBoundingClientRect(); return !t.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); })()`), "Closed-menu trigger does not overlay the mobile dialog");
          await capture(`${scheme}-${width}-sidebar`);
          await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape" });
          await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape" });
          await waitFor(`!document.querySelector('[role="dialog"]')`, "visual sidebar closes");
          assert(await evaluate(`document.activeElement?.getAttribute('aria-label') === 'Buka navigasi'`), "Mobile sidebar restores focus after Escape");
        }
      }
    }
    assert.deepEqual(apiErrors, []);
    assert.equal(exceptions.length, 0);
    console.log(JSON.stringify({ check: "non-personal-reference-visual-captures", screenshots }));
  } else if (process.env.UI_SMOKE_REPORTS_ONLY === "1") {
    async function report(input) {
      const url = new URL("/api/trpc/business.report", base);
      url.searchParams.set("input", JSON.stringify(input));
      const response = await fetch(url, { headers: { cookie: cookieHeader } });
      assert.equal(response.status, 200);
      assert(response.headers.get("cache-control")?.includes("no-store"));
      return (await response.json()).result.data;
    }
    const summary = await report({ kind: "luaran" });
    const selected = [...summary.groups].sort((a, b) => b.total - a.total).find(group => group.total > 50 && group.participations > group.total);
    assert(selected, "A shared multi-page output group is required");
    const input = { kind: "luaran", module: selected.module, tahun: selected.tahun, per_page: 50 };
    const firstPage = await report(input);
    const lastPage = Math.ceil(firstPage.total / 50);
    const lastData = await report({ ...input, page: lastPage });
    assert.equal(firstPage.total, selected.total);
    const path = `/laporan?jenis=luaran&module=${selected.module}&tahun=${selected.tahun}`;
    await navigate(path, "output report drill-down");
    const activityTable = `[...document.querySelectorAll('table')].find(t=>t.querySelector('caption')?.textContent==='Record luaran')`;
    await waitFor(`${activityTable}?.querySelectorAll('tbody tr').length === ${firstPage.rows.length}`, "output report rows match API");
    assert(await evaluate(`${activityTable}.querySelector('thead').innerText.includes('Kegiatan') && ${activityTable}.querySelector('thead').innerText.includes('SDM sumber')`), "Reports use business labels");
    assert(await evaluate(`[...${activityTable}.querySelectorAll('tbody tr')].every(row=>!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(row.cells[1].textContent))`), "Owner cells do not display raw UUIDs");
    await evaluate(`${activityTable}.querySelector('a').click()`);
    await waitFor(`location.pathname.startsWith('/${selected.module}/') && [...document.querySelectorAll('main h2')].some(h=>h.textContent==='Detail') && !document.querySelector('[aria-busy="true"]')`, "report record link proves parent membership");
    await evaluate("history.back()");
    await waitFor(`location.pathname==='/laporan' && !!${activityTable} && !document.querySelector('[aria-busy="true"]')`, "report browser Back");
    await evaluate(`[...document.querySelectorAll('nav[aria-label="Pagination"] button')].find(b=>b.textContent==='${lastPage}').click()`);
    await waitFor(`new URLSearchParams(location.search).get('page')==='${lastPage}' && document.querySelector('nav[aria-label="Pagination"] button[aria-current="page"]')?.textContent==='${lastPage}' && ${activityTable}?.querySelectorAll('tbody tr').length===${lastData.rows.length}`, "last report page reachable");
    const deepLink = await evaluate("location.pathname+location.search");
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    await navigate(deepLink, "report last-page deep link at 320px");
    await waitFor(fits, "report chart and pagination fit 320px");
    await evaluate(`[...document.querySelectorAll('main article button')].find(b=>b.textContent==='Tabel').click()`);
    await waitFor(`!![...document.querySelectorAll('caption')].find(c=>c.textContent==='Tren luaran tridharma')`, "chart table alternative");
    const chartRows = await evaluate(`[...[...document.querySelectorAll('caption')].find(c=>c.textContent==='Tren luaran tridharma').closest('table').querySelectorAll('tbody tr')].map(row=>[...row.cells].map((cell,index)=>index===0?cell.textContent:Number(cell.textContent.replaceAll('.',''))))`);
    const years = [...new Set(summary.groups.map(group=>group.tahun))].sort((a,b)=>a-b);
    const series = ["publikasi", "penelitian", "pengabdian"].filter(key=>summary.groups.some(group=>group.module===key&&group.total>0));
    assert.deepEqual(chartRows, years.map(year=>[String(year), ...series.map(key=>summary.groups.find(group=>group.module===key&&group.tahun===year)?.total??0)]));

    const bkdSummary = await report({ kind: "bkd" });
    const bkdGroup = [...bkdSummary.groups].sort((a,b)=>b.total-a.total).find(group=>group.total>0);
    assert(bkdGroup, "A BKD group is required");
    const bkdData = await report({ kind: "bkd", id_smt: bkdGroup.id_smt, simpulan: bkdGroup.simpulan });
    assert.equal(bkdData.total, bkdGroup.total);
    await navigate(`/laporan?jenis=bkd&id_smt=${encodeURIComponent(bkdGroup.id_smt)}&simpulan=${encodeURIComponent(bkdGroup.simpulan)}`, "BKD report drill-down");
    const bkdTable = `[...document.querySelectorAll('table')].find(t=>t.querySelector('caption')?.textContent==='Laporan akhir BKD per SDM')`;
    await waitFor(`${bkdTable}?.querySelectorAll('tbody tr').length===${bkdData.rows.length}`, "BKD rows match count unit");
    await evaluate(`${bkdTable}.querySelector('a').click()`);
    await waitFor(`location.pathname==='/bkd' && !!document.querySelector('button[aria-label="Pilih semester BKD"]') && !document.querySelector('[aria-busy="true"]')`, "BKD source link");
    assert(await evaluate(`new URLSearchParams(location.search).get('id_smt')===${JSON.stringify(bkdGroup.id_smt)}`), "Semester is preserved on the BKD source link");
    assert(await evaluate(fits), "BKD source page fits 320px");
    assert.equal(exceptions.length, 0);
    assert.deepEqual(apiErrors, []);
    console.log(JSON.stringify({ check: "report-chart-counts-owner-labels-and-drilldown-pagination", outputLastPage: lastPage, widths: [1280,320], passed: true }));
  } else if (process.env.UI_SMOKE_STATUS_ONLY === "1") {
    const runNav = 'nav[aria-label="Halaman riwayat sinkronisasi"]';
    const groupNav = 'nav[aria-label="Halaman kelompok status scope"]';
    const coverageNav = 'nav[aria-label="Halaman coverage endpoint"]';
    const currentPage = selector => `document.querySelector(${JSON.stringify(selector)})?.querySelector('button[aria-current="page"]')?.textContent`;
    await navigate("/replika/status?per_page=10", "paged sync history");
    await waitFor(`${currentPage(runNav)} === '1' && ${currentPage(groupNav)} === '1'`, "independent history pagers ready");
    await evaluate(`document.querySelector(${JSON.stringify(runNav)}).querySelector('button[aria-label="Halaman berikutnya"]').click()`);
    await waitFor(`${currentPage(runNav)} === '2' && ${currentPage(groupNav)} === '1'`, "run page changes independently");
    await evaluate(`document.querySelector(${JSON.stringify(groupNav)}).querySelector('button[aria-label="Halaman berikutnya"]').click()`);
    await waitFor(`${currentPage(runNav)} === '2' && ${currentPage(groupNav)} === '2'`, "scope group page changes independently");
    await evaluate("history.back()");
    await waitFor(`${currentPage(runNav)} === '2' && ${currentPage(groupNav)} === '1'`, "status browser Back");
    await evaluate("history.forward()");
    await waitFor(`${currentPage(runNav)} === '2' && ${currentPage(groupNav)} === '2'`, "status browser Forward");
    const deepLink = await evaluate("location.pathname + location.search");
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    await navigate(deepLink, "status page deep-link reload");
    assert(await evaluate(`${currentPage(runNav)} === '2' && ${currentPage(groupNav)} === '2'`), "Both status pages survive reload");
    assert(await evaluate(`Array.from(document.querySelectorAll('table')).every(t => t.querySelectorAll('tbody tr').length > 0)`), "Both final pages contain rows");
    assert(await evaluate(fits), "Status tables and pagers fit 320px");
    await evaluate(`document.querySelector('button[aria-label="Baris status per halaman"]').click()`);
    await waitFor(`!!document.querySelector('[role="listbox"]')`, "status page-size selector");
    await evaluate(`[...document.querySelectorAll('[role="option"]')].find(b => b.textContent === '20 baris').click()`);
    await waitFor(`new URLSearchParams(location.search).get('per_page') === '20' && new URLSearchParams(location.search).get('page_run') === '1' && new URLSearchParams(location.search).get('page_scope') === '1' && !document.querySelector('[aria-busy="true"]')`, "page size resets both pagers");
    await navigate("/replika/status?per_page=10&page_run=Infinity&page_scope=1.5", "invalid status pages recover");
    assert(await evaluate(`${currentPage(runNav)} === '1' && ${currentPage(groupNav)} === '1'`), "Invalid status page values default to first pages");
    const coverageResponse = await fetch(new URL("/api/trpc/replika.coverage", base), { headers: { cookie: cookieHeader } });
    assert.equal(coverageResponse.status, 200);
    const coverage = (await coverageResponse.json()).result.data;
    assert.equal(coverage.summary.templates, 135);
    const lastCoveragePage = Math.ceil(coverage.summary.templates / 10);
    const coverageTable = 'document.querySelector(\'[aria-label="Coverage per endpoint GET replika"] table\')';
    await navigate(`/replika/status?per_page=10&page_coverage=${lastCoveragePage}&page_run=2&page_scope=2`, "coverage final page deep link");
    await waitFor(`${currentPage(coverageNav)} === '${lastCoveragePage}' && ${coverageTable}?.querySelectorAll('tbody tr').length === 5`, "last five endpoint templates reachable");
    assert(await evaluate(`${currentPage(runNav)} === '2' && ${currentPage(groupNav)} === '2'`), "Coverage pagination does not change history pages");
    assert(await evaluate(fits), "Coverage fits 320px");
    await evaluate(`document.querySelector('button[aria-label="Filter coverage endpoint"]').click()`);
    await waitFor(`!!document.querySelector('[role="listbox"]')`, "coverage status filter");
    await evaluate(`[...document.querySelectorAll('[role="option"]')].find(b => b.textContent === 'Menunggu data induk').click()`);
    await waitFor(`new URLSearchParams(location.search).get('page_coverage') === '1' && ${coverageTable}?.querySelectorAll('tbody tr').length === 3`, "filter resets coverage page and displays three pending parents");
    await evaluate("history.back()");
    await waitFor(`${currentPage(coverageNav)} === '${lastCoveragePage}' && ${coverageTable}?.querySelectorAll('tbody tr').length === 5`, "coverage browser Back restores final page");
    await evaluate("history.forward()");
    await waitFor(`${coverageTable}?.querySelectorAll('tbody tr').length === 3`, "coverage browser Forward restores filter");
    await navigate("/replika/status?coverage_status=invalid&page_coverage=Infinity", "invalid coverage URL recovers");
    await waitFor(`${currentPage(coverageNav)} === '1' && ${coverageTable}?.querySelectorAll('tbody tr').length === 20`, "invalid coverage filter and page use safe defaults");
    await navigate("/referensi/dudi?page=1.5", "invalid business page recovers");
    assert(await evaluate(`document.querySelector('nav[aria-label="Pagination"] button[aria-current="page"]')?.textContent === '1'`), "Invalid business page defaults to 1");
    await navigate("/peringatan?page_scope=Infinity", "invalid warning page recovers");
    assert(await evaluate(`document.querySelector('nav[aria-label="Pagination"] button[aria-current="page"]')?.textContent === '1'`), "Invalid warning page defaults to 1");
    for (const role of ["ADMIN", "OPERATOR", "REVIEWER", "VIEWER"]) {
      await prisma.appUser.update({ where: { id: userId }, data: { role } });
      const response = await fetch(new URL("/api/trpc/replika.sync_status", base), { headers: { cookie: cookieHeader } });
      assert.equal(response.status, ["ADMIN", "OPERATOR"].includes(role) ? 200 : 403);
      const body = await response.json();
      if (response.status === 200) assert.equal(body.result.data.per_page, 20, "Omitted API input retains defaults");
      const coverageResult = await fetch(new URL("/api/trpc/replika.coverage", base), { headers: { cookie: cookieHeader } });
      assert.equal(coverageResult.status, ["ADMIN", "OPERATOR"].includes(role) ? 200 : 403);
      await coverageResult.body?.cancel();
    }
    assert.deepEqual(apiErrors, []);
    assert.equal(exceptions.length, 0);
    console.log(JSON.stringify({ check: "complete-status-pagination-url-state-and-role-boundaries", width: 320, passed: true }));
  } else if (process.env.UI_SMOKE_NAVIGATION_CRAWL_ONLY === "1") {
    const baseline = process.env.UI_SMOKE_CRAWL_BASELINE === "1";
    const phase = process.env.UI_SMOKE_CRAWL_PHASE ?? "all";
    assert(["all", "menus", "details", "extras"].includes(phase), "Unknown crawl phase");
    const requestedWidth = process.env.UI_SMOKE_CRAWL_WIDTH;
    assert(!requestedWidth || ["1280", "320"].includes(requestedWidth), "Crawl width must be 1280 or 320");
    const widths = baseline ? [1280] : requestedWidth ? [Number(requestedWidth)] : [1280,320];
    const offset = Number(process.env.UI_SMOKE_CRAWL_OFFSET ?? 0);
    const limit = Number(process.env.UI_SMOKE_CRAWL_LIMIT ?? 1000);
    assert(Number.isInteger(offset) && offset >= 0 && Number.isInteger(limit) && limit > 0, "Crawl range must contain positive integers");
    await navigate("/", "navigation inventory");
    const menuTargets = await evaluate(`(() => [...new Set([...document.querySelectorAll('aside:not([role="dialog"]) nav a[href]')].map(a=>new URL(a.href).pathname+new URL(a.href).search))])()`);
    assert(menuTargets.length >= 100, "Crawl must include the full rendered ADMIN sidebar, not a handpicked subset");
    const results = [];
    const detailTargets = [];
    let unavailableDetailSamples = 0;
    if (!baseline && ["all", "details"].includes(phase)) {
      const integrationId = process.env.SISTER_INTEGRATION_ID;
      assert(integrationId, "A configured integration is required for the read-only crawl");
      const sdm = await prisma.sisterReplicaRecord.findFirst({ where: { integrationId, endpoint: "/referensi/sdm", deletedAt: null }, select: { itemKey: true } });
      assert(sdm, "A local SDM is required for populated profile navigation checks");
      for (const entry of jelajahModules.filter(entry=>entry.kind==='sdm_object')) {
        detailTargets.push(`/pegawai/${encodeURIComponent(sdm.itemKey)}?tab=${encodeURIComponent(entry.key)}`);
      }
      for (const entry of jelajahModules.filter(entry=>entry.kind==='sdm_list' && entry.detailPath)) {
        const parents = await prisma.sisterReplicaRecord.findMany({ where: { integrationId, endpoint: entry.path, deletedAt: null, idSdm: { not: null } }, select: { itemKey: true, idSdm: true }, take: 5 });
        let parent;
        for (const candidate of parents) {
          if (await prisma.sisterReplicaRecord.count({ where: { integrationId, endpoint: "/referensi/sdm", itemKey: candidate.idSdm, deletedAt: null } })) { parent=candidate; break; }
        }
        if (parent) detailTargets.push(`${entry.detailPath.replace('{id}',encodeURIComponent(parent.itemKey))}?id_sdm=${encodeURIComponent(parent.idSdm)}`);
        else unavailableDetailSamples++;
      }
    }
    async function auditCurrent(label, width) {
      const result = await evaluate(`(() => {
        const main=document.querySelector('main');
        const active=document.querySelector('aside:not([role="dialog"]) nav a[aria-current="page"]');
        const lists=[...main.querySelectorAll('[role="tablist"]')];
        return { submenu: !!active?.closest('details'), modulePicker: !!main.querySelector('nav[aria-label="Modul SISTER"]'),
          tablists: lists.length, maxTabs: Math.max(0,...lists.map(list=>list.querySelectorAll('[role="tab"]').length)),
          fits: document.documentElement.scrollWidth<=innerWidth };
      })()`);
      results.push({ ...result, width });
      if (!baseline) {
        assert(result.fits, `Navigation crawl viewport overflow: ${label}`);
        assert(!(result.submenu || result.modulePicker) || result.tablists === 0, `Submenu and tabs combined: ${label}`);
        assert(result.tablists <= 1 && result.maxTabs <= 5, `Too many view tabs: ${label}`);
        const path = await evaluate("location.pathname");
        assert(result.tablists === 0 || ["/laporan", "/peringatan"].includes(path), `Unapproved second navigation layer: ${label}`);
      }
    }
    const selectedMenus = baseline ? ["/replika"] : ["all", "menus"].includes(phase) ? menuTargets.slice(offset, offset + limit) : [];
    for (const width of widths) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
      for (const [index,path] of selectedMenus.entries()) {
        await navigate(path, "navigation crawl target");
        await auditCurrent(`menu target ${index}`, width);
      }
      for (const [index,path] of detailTargets.entries()) {
        await navigate(path, "populated profile/detail crawl");
        await auditCurrent(`populated profile/detail ${index}`, width);
      }
      console.log(JSON.stringify({ check: "navigation-crawl-progress", width, menus: selectedMenus.length, populatedDetails: detailTargets.length }));
      if (!baseline && !["all", "extras"].includes(phase)) continue;
      // Populate the technical explorer from a non-personal local reference.
      // No Jelajah list/search or upstream file requests are submitted here.
      await navigate("/replika", "populated local explorer");
      await waitFor(`!!document.querySelector('nav[aria-label="Modul SISTER"]')`, "local module picker ready");
      await evaluate(`[...document.querySelectorAll('nav[aria-label="Modul SISTER"] button')].find(b=>b.textContent.trim()==='Agama').click()`);
      await waitFor(`!!document.querySelector('main table caption') && document.querySelector('main table caption').textContent==='Agama' && !document.querySelector('[aria-busy="true"]')`, "local reference explorer renders");
      await auditCurrent("populated local explorer", width);
      if (!baseline) {
        await waitFor(`!!document.querySelector('main details[data-explorer-diagnostics]')`, "technical diagnostics disclosure available");
        await evaluate(`document.querySelector('main details[data-explorer-diagnostics]').open=true`);
        await auditCurrent("expanded technical diagnostics", width);
        await waitFor(`!!document.querySelector('main details[data-explorer-diagnostics] pre')`, "raw JSON remains accessible without tabs");
        await auditCurrent("diagnostics rendered after expansion", width);
        for (const path of ["/laporan?jenis=sdm", "/laporan?jenis=bkd", "/laporan?jenis=luaran", "/peringatan?jenis=data", "/peringatan?jenis=bkd"]) {
          await navigate(path, "small view tab crawl");
          await auditCurrent("workspace view tabs", width);
        }
      }
    }
    assert.deepEqual(apiErrors, []);
    assert.equal(exceptions.length, 0);
    console.log(JSON.stringify({ check: baseline ? "navigation-combination-baseline" : "all-rendered-menu-navigation-crawl",
      phase, menuOffset: offset, scannedMenusPerWidth: selectedMenus.length,
      menuTargets: menuTargets.length, populatedProfileAndDetailSamples: detailTargets.length, unavailableDetailSamples, visits: results.length,
      submenuAndTabs: results.filter(row=>(row.submenu||row.modulePicker)&&row.tablists>0).length,
      tabOnlyVisits: results.filter(row=>!(row.submenu||row.modulePicker)&&row.tablists>0).length,
      widths, passed: !baseline }));
  } else if (process.env.UI_SMOKE_NAVIGATION_ONLY === "1" || process.env.UI_SMOKE_TABS_ONLY === "1") {
    // TABS_ONLY remains a compatible alias; duplicate BKD/profile tabs no longer exist.
    const sample = await prisma.$queryRawUnsafe(
      `SELECT b.id_sdm AS id, b.payload_json->>'id_smt' AS semester
         FROM sister_replica_record b
        WHERE b.integration_id=$1::uuid AND b.endpoint='/bkd/laporan_akhir_bkd'
          AND b.deleted_at IS NULL AND b.payload_json->>'id_smt' IS NOT NULL
          AND EXISTS (SELECT 1 FROM sister_replica_record s
            WHERE s.integration_id=b.integration_id AND s.endpoint='/referensi/sdm'
              AND s.item_key=b.id_sdm AND s.deleted_at IS NULL)
        LIMIT 1`, process.env.SISTER_INTEGRATION_ID,
    );
    assert(sample[0], "A local SDM and BKD semester sample is required");
    const { id, semester } = sample[0];
    async function clickSidebarTab(key, mobile) {
      if (mobile) {
        await evaluate(`document.querySelector('button[aria-label="Buka navigasi"]').click()`);
        await waitFor(`!!document.querySelector('aside[role="dialog"]')`, "mobile sidebar opens");
      }
      const selector = mobile ? 'aside[role="dialog"]' : 'aside:not([role="dialog"])';
      await evaluate(`(() => {
        const link = [...document.querySelector(${JSON.stringify(selector)}).querySelectorAll('a')].find(a=>new URL(a.href).searchParams.get('tab')===${JSON.stringify(key)});
        if (!link) throw new Error('Missing section link');
        link.closest('details').open=true; link.click();
      })()`);
      await waitFor(`new URLSearchParams(location.search).get('tab')===${JSON.stringify(key)} && !document.querySelector('[aria-busy="true"]')`, "sidebar section changes");
      if (mobile) await waitFor(`!document.querySelector('aside[role="dialog"]')`, "mobile sidebar closes after navigation");
    }
    for (const width of [1280, 320]) {
      const mobile = width === 320;
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await navigate(`/pegawai/${encodeURIComponent(id)}?tab=profil`, "SDM sidebar-only navigation");
      await waitFor(`!!document.querySelector('#sdm-section-heading')`, "profile section ready");
      assert(await evaluate(`!document.querySelector('main [role="tablist"]')`), "SDM does not repeat submenu as tabs");
      await clickSidebarTab("kepegawaian", mobile);
      await waitFor(`document.querySelector('#sdm-section-heading')?.textContent==='Kepegawaian'`, "personal section heading updates");
      assert(await evaluate(`location.pathname===${JSON.stringify(`/pegawai/${id}`)}`), "Personal navigation preserves SDM");
      await evaluate("history.back()");
      await waitFor(`document.querySelector('#sdm-section-heading')?.textContent==='Profil'`, "personal Back restores section");
      await evaluate("history.forward()");
      await waitFor(`document.querySelector('#sdm-section-heading')?.textContent==='Kepegawaian'`, "personal Forward restores section");
      assert(await evaluate(fits), "Personal section fits viewport");
      await navigate(`/bkd?tab=laporan_akhir_bkd&id_sdm=${encodeURIComponent(id)}&id_smt=${encodeURIComponent(semester)}`, "BKD sidebar-only navigation");
      await waitFor(`!!document.querySelector('#bkd-section-heading')`, "BKD section ready");
      assert(await evaluate(`!document.querySelector('main [role="tablist"]')`), "BKD does not repeat submenu as tabs");
      await clickSidebarTab("bkd_ajar", mobile);
      await waitFor(`document.querySelector('#bkd-section-heading')?.textContent==='BKD pengajaran'`, "BKD section heading updates");
      assert(await evaluate(`new URLSearchParams(location.search).get('id_sdm')===${JSON.stringify(id)} && new URLSearchParams(location.search).get('id_smt')===${JSON.stringify(semester)}`), "BKD navigation preserves SDM and semester");
      assert(await evaluate(fits), "BKD section fits viewport");
      const deepLink = await evaluate("location.pathname+location.search");
      await navigate(deepLink, "BKD section deep-link reload");
      await waitFor(`document.querySelector('#bkd-section-heading')?.textContent==='BKD pengajaran'`, "BKD deep link restores section");
    }
    await navigate("/laporan", "small read-only report tabs remain");
    await waitFor(`!!document.querySelector('[role="tablist"][aria-label="Jenis laporan"]')`, "report tabs ready");
    await evaluate(`document.querySelector('[role="tablist"][aria-label="Jenis laporan"] [role="tab"]').focus()`);
    for (const [key, expected] of [["ArrowLeft", "luaran"], ["Home", "sdm"], ["End", "luaran"], ["ArrowRight", "sdm"]]) {
      await send("Input.dispatchKeyEvent", { type: "keyDown", key });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key });
      await waitFor(`document.activeElement?.id.endsWith('-tab-${expected}') && document.activeElement?.getAttribute('aria-selected')==='true' && !document.querySelector('[aria-busy="true"]')`, "remaining report tab keyboard focus and selection");
    }
    assert.equal(exceptions.length, 0);
    assert.deepEqual(apiErrors, []);
    console.log(JSON.stringify({ check: "single-layer-sidebar-sections-and-small-view-tabs", widths: [1280,320], passed: true }));
  } else if (process.env.UI_SMOKE_PROGRAMS_ONLY === "1") {
    const url = new URL("/api/trpc/business.program_studies", base);
    url.searchParams.set("input", JSON.stringify({ page: 1, per_page: 20 }));
    const response = await fetch(url, { headers: { cookie: cookieHeader } });
    assert.equal(response.status, 200);
    const programs = (await response.json()).result.data;
    assert(programs.total > 0 && programs.options.length > 0, "Owned program options required");
    await navigate("/referensi/mahasiswa_pddikti", "student search form");
    await waitFor(`document.querySelector('button[aria-label="Pilih program studi"]') && !document.querySelector('button[aria-label="Pilih program studi"]').disabled`, "program selector ready");
    await evaluate(`document.querySelector('button[aria-label="Pilih program studi"]').click()`);
    await waitFor(`document.querySelectorAll('[role="listbox"] [role="option"]').length === ${programs.options.length}`, "filtered program options render");
    assert(await evaluate(fits), "Program selector fits desktop viewport");
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape" });
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    assert(await evaluate(fits), "Program search form fits 320px");
    for (const role of ["ADMIN", "OPERATOR", "REVIEWER", "VIEWER"]) {
      await prisma.appUser.update({ where: { id: userId }, data: { role } });
      const result = await fetch(url, { headers: { cookie: cookieHeader } });
      assert.equal(result.status, role === "ADMIN" ? 200 : 403, "Program options remain ADMIN-only with real sessions");
      await result.body?.cancel();
    }
    assert.equal(exceptions.length, 0);
    assert.deepEqual(apiErrors, []);
    console.log(JSON.stringify({ check: "owned-program-selector-and-real-session-roles", options: programs.options.length, total: programs.total, widths: [1280, 320], passed: true }));
  } else {
  const routes = new Set(["/", "/pegawai", "/referensi", "/laporan", "/peringatan", "/akses"]);
  for (const entry of jelajahModules) {
    if (entry.kind === "sdm_object") routes.add(`/pegawai?tab=${encodeURIComponent(entry.key)}`);
    else if (entry.key.startsWith("bkd_") || entry.key === "laporan_akhir_bkd") routes.add(`/bkd?tab=${encodeURIComponent(entry.key)}`);
    else {
      const query = new URLSearchParams(entry.query ?? {}).toString();
      routes.add(`${entry.path}${query ? `?${query}` : ""}`);
    }
  }
  for (const path of detailsOnly ? [] : routes) {
    await navigate(path);
    assert(await evaluate(fits), `Desktop overflow: ${new URL(path, base).pathname}`);
  }
  if (!detailsOnly) console.log(JSON.stringify({ check: "authenticated-admin-menu-targets", routes: routes.size, passed: true }));

  const integrationId = process.env.SISTER_INTEGRATION_ID;
  assert(integrationId, "A configured local replica integration is required for detail samples");
  const detailResults = [];
  for (const entry of childPagesOnly ? [] : jelajahModules.filter(entry => entry.kind === "sdm_list" && entry.detailPath)) {
    const parents = await prisma.sisterReplicaRecord.findMany({
      where: { integrationId, endpoint: entry.path, deletedAt: null, idSdm: { not: null } },
      select: { itemKey: true, idSdm: true }, take: 5,
    });
    let parent;
    for (const candidate of parents) {
      if (await prisma.sisterReplicaRecord.count({ where: { integrationId, endpoint: "/referensi/sdm", itemKey: candidate.idSdm, deletedAt: null } })) { parent = candidate; break; }
    }
    if (!parent) { detailResults.push({ module: entry.key, state: "no-active-parent-sample" }); continue; }
    const path = `${entry.detailPath.replace("{id}", encodeURIComponent(parent.itemKey))}?id_sdm=${encodeURIComponent(parent.idSdm)}`;
    for (const width of [1280, 320]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await navigate(path, `detail module ${entry.key}`);
      assert(await evaluate(`!!document.querySelector('main h2')`), `Detail sections render for ${entry.key}`);
      assert(await evaluate(fits), `Detail overflow at ${width}px for module ${entry.key}`);
    }
    detailResults.push({ module: entry.key, state: "sample-rendered" });
  }
  console.log(JSON.stringify({ check: "cached-business-detail-and-child-sections", widths: [1280, 320], modules: detailResults }));
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  // Find one active parent with two independently paginated cached arrays.
  // Only IDs remain in memory; neither IDs nor array payloads are printed.
  const multiSection = await prisma.$queryRawUnsafe(
    `SELECT p.item_key AS "itemKey", p.id_sdm AS "idSdm"
       FROM sister_replica_record d
       JOIN sister_replica_record p ON p.integration_id=d.integration_id
        AND p.endpoint=$2 AND p.item_key=d.parent_id AND p.deleted_at IS NULL
       JOIN sister_replica_record s ON s.integration_id=p.integration_id
        AND s.endpoint=$4 AND s.item_key=p.id_sdm AND s.deleted_at IS NULL
      WHERE d.integration_id=$1::uuid AND d.endpoint=$3 AND d.deleted_at IS NULL
        AND CASE WHEN jsonb_typeof(d.payload_json->'anggota')='array'
          THEN jsonb_array_length(d.payload_json->'anggota') ELSE 0 END > 20
        AND CASE WHEN jsonb_typeof(d.payload_json->'dokumen')='array'
          THEN jsonb_array_length(d.payload_json->'dokumen') ELSE 0 END > 20
      LIMIT 1`, integrationId, "/pengabdian", "/pengabdian/{id}", "/referensi/sdm",
  );
  if (multiSection[0]) {
    const sample = multiSection[0];
    const path = `/pengabdian/${encodeURIComponent(sample.itemKey)}?id_sdm=${encodeURIComponent(sample.idSdm)}`;
    await navigate(path, "independent child pagination sample");
    const section = label => `[...document.querySelectorAll('main section')].find(s => s.querySelector('h2')?.textContent === '${label}')`;
    await waitFor(`${section("anggota")}?.querySelector('button[aria-label="Halaman berikutnya"]') && ${section("dokumen")}?.querySelector('button[aria-label="Halaman berikutnya"]')`, "two independently paginated child sections");
    await evaluate(`${section("anggota")}.querySelector('button[aria-label="Halaman berikutnya"]').click()`);
    await waitFor(`${section("anggota")}?.querySelector('button[aria-current="page"]')?.textContent === '2' && !document.querySelector('[aria-busy="true"]')`, "members page 2");
    assert(await evaluate(`${section("dokumen")}.querySelector('button[aria-current="page"]')?.textContent === '1'`), "Paging members must not change document page");
    await evaluate(`${section("dokumen")}.querySelector('button[aria-label="Halaman berikutnya"]').click()`);
    await waitFor(`${section("dokumen")}?.querySelector('button[aria-current="page"]')?.textContent === '2' && !document.querySelector('[aria-busy="true"]')`, "documents page 2");
    assert(await evaluate(`${section("anggota")}.querySelector('button[aria-current="page"]')?.textContent === '2'`), "Paging documents must preserve member page");
    const deepLink = await evaluate("location.pathname + location.search");
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    await navigate(deepLink, "child-section page state reload");
    for (const label of ["anggota", "dokumen"]) {
      assert(await evaluate(`${section(label)}.querySelector('button[aria-current="page"]')?.textContent === '2' && ${section(label)}.querySelectorAll('tbody tr').length > 0`), "Child page state and rows survive reload");
    }
    assert(await evaluate(fits), "Multi-section detail must fit at 320px");
    console.log(JSON.stringify({ check: "independent-child-pagination-and-deep-link", passed: true }));
  } else {
    console.log(JSON.stringify({ check: "independent-child-pagination-and-deep-link", state: "no-multi-section-sample" }));
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  if (detailsOnly) {
    assert.equal(exceptions.length, 0, "No uncaught detail-page browser exceptions");
    assert.deepEqual(apiErrors, [], "Cached detail requests must succeed");
  }
  if (!detailsOnly) {
  for (const path of ["/jabatan_fungsional/ajuan", "/pendidikan_formal/ajuan", "/sertifikasi_dosen/ajuan", "/nilai_tes/ajuan"]) {
    await navigate(path);
    assert(await evaluate(`document.querySelector('aside nav a[aria-current="page"]')?.textContent.toLowerCase().includes('ajuan')`), "Ajuan deep link must select the Ajuan menu, not a record detail");
  }
  await navigate("/referensi/dudi");
  await waitFor(`!!document.querySelector('nav[aria-label="Pagination"]')`, "DUDI pagination");
  const lastPage = await evaluate(`Number([...document.querySelectorAll('nav[aria-label="Pagination"] button')].map(b => b.textContent).filter(t => /^\\d+$/.test(t)).at(-1))`);
  assert(lastPage > 1000, "DUDI must exceed the old page cap");
  await evaluate(`[...document.querySelectorAll('nav[aria-label="Pagination"] button')].find(b => b.textContent === '${lastPage}').click()`);
  await waitFor(`new URLSearchParams(location.search).get('page') === '${lastPage}' && document.querySelector('nav[aria-label="Pagination"] button[aria-current="page"]')?.textContent === '${lastPage}' && document.querySelector('button[aria-label="Halaman berikutnya"]').disabled`, "DUDI last-page URL state");
  await evaluate("history.back()");
  await waitFor(`!new URLSearchParams(location.search).has('page') && document.querySelector('nav[aria-label="Pagination"] button[aria-current="page"]')?.textContent === '1'`, "DUDI browser Back");
  await evaluate("history.forward()");
  await waitFor(`new URLSearchParams(location.search).get('page') === '${lastPage}' && document.querySelector('nav[aria-label="Pagination"] button[aria-current="page"]')?.textContent === '${lastPage}'`, "DUDI browser Forward");
  await navigate(`/referensi/dudi?page=${lastPage}`);
  assert(await evaluate(`document.querySelectorAll('tbody tr').length > 0`), "DUDI deep link must retain rows");

  await navigate("/peringatan");
  const warningLastPage = await evaluate(`Number([...document.querySelectorAll('nav[aria-label="Pagination"] button')].map(b => b.textContent).filter(t => /^\\d+$/.test(t)).at(-1))`);
  assert(warningLastPage > 10, "Warning scopes must exceed the old 200-result truncation");
  await navigate(`/peringatan?page_scope=${warningLastPage}`);
  assert(await evaluate(`document.querySelector('nav[aria-label="Pagination"] button[aria-current="page"]')?.textContent === '${warningLastPage}' && document.querySelector('button[aria-label="Halaman berikutnya"]').disabled`), "Warning last-page deep link must work");
  assert(await evaluate(`document.querySelector('table caption') && [...document.querySelectorAll('table')].find(t => t.querySelector('caption')?.textContent === 'Scope replika gagal')?.querySelectorAll('tbody tr').length > 0`), "Last warning page must contain rows");

  for (const width of [1024, 390, 320]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
    const pages = width === 320 ? routes : ["/referensi/dudi", "/pendidikan_formal/ajuan", "/peringatan", "/pegawai"];
    for (const path of pages) {
      await navigate(path);
      assert(await evaluate(fits), `ADMIN layout overflows at ${width}px: ${path}`);
    }
  }
  console.log(JSON.stringify({ check: "admin-deep-links-and-responsive-pages", widths: [1280, 1024, 390, 320], allMenuTargetsAt320: routes.size, dudiLastPage: lastPage, warningLastPage, passed: true }));
  assert.equal(exceptions.length, 0, "No uncaught browser exceptions");
  assert.deepEqual(apiErrors, [], "All ADMIN tRPC requests must succeed (upstream source errors may still be represented in DTOs)");

  // Real session + database role changes, not synthetic caller contexts.
  // These are local read APIs; denial audits are intentionally retained.
  async function procedure(name, input) {
    const url = new URL(`/api/trpc/${name}`, base);
    if (input !== undefined) url.searchParams.set("input", JSON.stringify(input));
    return fetch(url, { headers: { cookie: cookieHeader, origin: base.origin }, signal: AbortSignal.timeout(15000) });
  }
  for (const role of ["ADMIN", "OPERATOR", "REVIEWER", "VIEWER"]) {
    await prisma.appUser.update({ where: { id: userId }, data: { role } });
    const session = await procedure("overview.session");
    assert.equal(session.status, 200);
    assert.equal((await session.json()).result.data.role, role, "Session role must reflect the database, not stale browser state");
    for (const [name, input, expected] of [
      ["business.modules", undefined, role === "ADMIN" ? 200 : 403],
      ["replika.modules", {}, ["ADMIN", "OPERATOR"].includes(role) ? 200 : 403],
      ["replika.rows", { module: "ref_agama" }, ["ADMIN", "OPERATOR"].includes(role) ? 200 : 403],
    ]) {
      const response = await procedure(name, input);
      assert.equal(response.status, expected, `Real session role boundary: ${role}/${name}`);
      const result = await response.json();
      if (expected === 403) assert.equal(result.error.data.code, "FORBIDDEN");
    }
  }
  await prisma.appUser.update({ where: { id: userId }, data: { isActive: false } });
  assert.equal((await procedure("overview.session")).status, 401, "Deactivation must revoke effective access with an existing cookie");
  const deniedFile = await fetch(new URL("/api/sister/file/dokumen/00000000-0000-4000-8000-000000000000", base), { headers: { cookie: cookieHeader }, signal: AbortSignal.timeout(15000) });
  assert.equal(deniedFile.status, 401, "Inactive accounts cannot fetch files");
  await deniedFile.body?.cancel();
  console.log(JSON.stringify({ check: "real-session-role-matrix-and-deactivation", roles: 4, passed: true }));
  }
  }
} finally {
  if (ws) ws.close();
  if (target) await fetch(`${debuggerUrl}/json/close/${target.id}`).catch(() => {});
  if (created) {
    await prisma.appUser.delete({ where: { id: userId } });
    assert.equal(await prisma.authSession.count({ where: { userId } }), 0);
    assert.equal(await prisma.authAccount.count({ where: { userId } }), 0);
    console.log(JSON.stringify({ cleanup: "temporary ADMIN, credential and sessions removed; audit events retained" }));
  }
  await prisma.$disconnect();
}
