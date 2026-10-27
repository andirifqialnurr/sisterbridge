// Shared dependency-free CDP client for isolated localhost QA profiles.
import assert from "node:assert/strict";

export async function connectBrowserPage(debuggerUrl = "http://127.0.0.1:9333") {
  assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(debuggerUrl).hostname), "Local debugger only");
  const target = await (await fetch(`${debuggerUrl}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  const calls = new Map();
  const listeners = new Set();
  const exceptions = [];
  const eventErrors = [];
  let sequence = 0;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { calls.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
      calls.set(id, { resolve, reject, timer });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  ws.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") exceptions.push("uncaught exception");
    if (message.id) {
      const call = calls.get(message.id);
      if (!call) return;
      calls.delete(message.id); clearTimeout(call.timer);
      if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result);
    } else {
      for (const listener of listeners) Promise.resolve().then(() => listener(message)).catch(() => eventErrors.push("CDP event handler failed"));
    }
  });
  async function evaluate(expression) {
    const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    assert(!response.exceptionDetails, "Browser expression failed");
    return response.result.value;
  }
  async function waitFor(expression, label, timeout = 30000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Timed out: ${label}`);
  }
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  return {
    send, evaluate, waitFor, exceptions, eventErrors,
    onEvent(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async close() {
      listeners.clear(); ws.close();
      await fetch(`${debuggerUrl}/json/close/${target.id}`).catch(() => {});
      for (const call of calls.values()) { clearTimeout(call.timer); call.reject(new Error("QA page closed")); }
      calls.clear();
    },
  };
}
