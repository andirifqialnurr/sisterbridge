// Dependency-free Chrome DevTools smoke test. Requires Node 22+, a local
// fixture-mode dev server, and an isolated Chrome profile (never a user profile).
// Example:
// SISTER_FIXTURE_MODE=true bun run dev
// chrome --headless=new --remote-debugging-port=9333 --user-data-dir=<temp-dir>
// node scripts/browser_ui_smoke.mjs
// Only structural assertions are printed; no SDM IDs, names or table payloads.
import assert from "node:assert/strict";

const baseUrl = process.env.UI_SMOKE_BASE_URL ?? "http://localhost:2700";
const debuggerUrl = process.env.UI_SMOKE_DEBUG_URL ?? "http://127.0.0.1:9333";
for (const url of [baseUrl, debuggerUrl]) {
  assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname), "Smoke testing is local-only");
}
const target = await (await fetch(`${debuggerUrl}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});
let sequence = 0;
const pending = new Map();
const errors = [];
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
  if (!message.id) return;
  const call = pending.get(message.id);
  if (!call) return;
  pending.delete(message.id);
  clearTimeout(call.timer);
  if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result);
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timed out: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  assert(!response.exceptionDetails, "Browser expression failed");
  return response.result.value;
}
async function waitFor(expression, label) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out: ${label}`);
}
async function key(key, modifiers = 0) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, modifiers });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, modifiers });
}
async function click(selector) {
  const point = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
}
const visible = `(e) => e.getClientRects().length > 0`;
const fits = `document.documentElement.scrollWidth <= innerWidth`;
try {
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.bringToFront");
  await send("Page.navigate", { url: `${baseUrl}/replika` });
  await waitFor(`document.querySelector('button[aria-label="Pilih SDM"]')?.textContent.match(/\\([1-9][0-9]*\\)/) && [...document.querySelectorAll('button')].some(b => b.textContent === 'DUDI')`, "replica hydration and local SDM index");

  // Exercise a large reference dataset without opening any personal detail.
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent === 'DUDI').click()`);
  await waitFor(`document.querySelector('nav[aria-label="Pagination"] button[aria-current="page"]')?.textContent === '1'`, "DUDI first page");
  await evaluate(`document.querySelector('button[aria-label="Halaman berikutnya"]').click()`);
  await waitFor(`document.querySelector('nav[aria-label="Pagination"] button[aria-current="page"]')?.textContent === '2' && !document.querySelector('button[aria-label="Halaman berikutnya"]').disabled`, "DUDI second page");
  const lastPage = await evaluate(`Number([...document.querySelectorAll('nav[aria-label="Pagination"] button')].map(b => b.textContent).filter(t => /^\\d+$/.test(t)).at(-1))`);
  assert(lastPage > 200, "Large reference dataset must be available for this test");
  await evaluate(`[...document.querySelectorAll('nav[aria-label="Pagination"] button')].find(b => b.textContent === '${lastPage}').click()`);
  await waitFor(`document.querySelector('nav[aria-label="Pagination"] button[aria-current="page"]')?.textContent === '${lastPage}' && document.querySelector('button[aria-label="Halaman berikutnya"]').disabled && !document.querySelector('button[aria-label="Halaman sebelumnya"]').disabled`, "DUDI last page");
  assert(await evaluate(`document.querySelectorAll('tbody tr').length > 0`), "Last page must contain rows");
  console.log(JSON.stringify({ check: "large-reference-pagination", lastPage, passed: true }));

  for (const width of [1280, 1024, 390, 320]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (!await evaluate(fits)) {
      const overflow = await evaluate(`Array.from(document.querySelectorAll('main *, header *, nav *')).filter(e => e.getClientRects().length && e.getBoundingClientRect().right > innerWidth).slice(0,12).map(e => ({tag:e.tagName, className:e.className, width:Math.round(e.getBoundingClientRect().width)}))`);
      assert.fail(`Page overflows at ${width}px: ${JSON.stringify(overflow)}`);
    }
    if (width < 1024) {
      await click('button[aria-label="Buka navigasi"]');
      await waitFor(`!!document.querySelector('[role="dialog"][aria-modal="true"]')`, "mobile sidebar opens");
      assert(await evaluate(`document.querySelector('[role="dialog"]').contains(document.activeElement)`), "Sidebar receives focus");
      assert(await evaluate(`document.body.style.overflow === 'hidden'`), "Sidebar locks body scroll");
      assert(await evaluate(fits), `Open sidebar overflows at ${width}px`);
      await evaluate(`{ const d=document.querySelector('[role="dialog"]'); const f=[...d.querySelectorAll('a[href],button:not([disabled]),summary')].filter(${visible}); f.at(-1).focus(); }`);
      await key("Tab");
      assert(await evaluate(`{ const d=document.querySelector('[role="dialog"]'); document.activeElement === [...d.querySelectorAll('a[href],button:not([disabled]),summary')].filter(${visible})[0]; }`), "Tab wraps within sidebar");
      await key("Tab", 8);
      assert(await evaluate(`{ const d=document.querySelector('[role="dialog"]'); document.activeElement === [...d.querySelectorAll('a[href],button:not([disabled]),summary')].filter(${visible}).at(-1); }`), "Shift+Tab wraps within sidebar");
      await key("Escape");
      await waitFor(`!document.querySelector('[role="dialog"]')`, "Escape closes sidebar");
      assert(await evaluate(`document.activeElement?.getAttribute('aria-label') === 'Buka navigasi'`), "Sidebar restores trigger focus");
      assert(await evaluate(`document.body.style.overflow !== 'hidden'`), "Sidebar unlocks body scroll");
    } else {
      assert(await evaluate(`[...document.querySelectorAll('aside nav[aria-label="Navigasi utama"]')].some(${visible})`), "Desktop sidebar visible");
    }
    for (const scheme of ["light", "dark"]) {
      await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
      await waitFor(`document.documentElement.classList.contains('${scheme}')`, `${scheme} theme applied`);
      assert(await evaluate(fits), `${scheme} page overflows at ${width}px`);
    }
    console.log(JSON.stringify({ check: "layout-and-sidebar-keyboard", width, passed: true }));
  }
  await click('button[aria-label="Pilih SDM"]');
  await waitFor(`!!document.querySelector('[role="listbox"]')`, "SDM picker opens");
  assert(await evaluate(`document.querySelector('[role="listbox"]').contains(document.activeElement)`), "Picker focuses an option");
  await key("End");
  assert(await evaluate(`document.activeElement === [...document.querySelectorAll('[role="listbox"] [role="option"]')].at(-1)`), "End focuses final option");
  await key("Home");
  assert(await evaluate(`document.activeElement === document.querySelector('[role="listbox"] [role="option"]')`), "Home focuses first option");
  await key("Escape");
  await waitFor(`!document.querySelector('[role="listbox"]')`, "Escape closes picker");
  assert(await evaluate(`document.activeElement?.getAttribute('aria-label') === 'Pilih SDM'`), "Picker restores trigger focus");
  console.log(JSON.stringify({ check: "select-keyboard", passed: true }));
  assert.equal(errors.length, 0, "No uncaught browser exceptions");
  console.log(JSON.stringify({ passed: true, scope: "fixture operator, local replica; not full ADMIN or upstream QA" }));
} finally {
  ws.close();
  await fetch(`${debuggerUrl}/json/close/${target.id}`).catch(() => {});
}
