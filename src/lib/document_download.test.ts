import { expect, it, vi } from "vitest";
import { documentFilename, requestDocument } from "./document_download";
import { sisterFileMaxBytes } from "./sister_file_policy";

const id = "33333333-3333-4333-8333-333333333333";
const headers = { "content-type": "application/pdf", "content-disposition": 'attachment; filename="synthetic.pdf"' };
function fetcher(response: Response) { return vi.fn<typeof fetch>().mockResolvedValue(response); }

it("uses only the same-origin authenticated no-store route and preserves bytes", async () => {
  const mock = fetcher(new Response(new Uint8Array([1, 2, 255]), { headers }));
  const result = await requestDocument(id, new AbortController().signal, mock);
  expect(mock).toHaveBeenCalledExactlyOnceWith(`/api/sister/file/dokumen/${id}`, expect.objectContaining({ cache: "no-store", redirect: "error", credentials: "same-origin", signal: expect.any(AbortSignal) }));
  expect(result.filename).toBe("synthetic.pdf");
  expect([...new Uint8Array(await result.blob.arrayBuffer())]).toEqual([1, 2, 255]);
});

it.each([[401, "Sesi berakhir"], [403, "Role Anda"], [404, "integrasi aktif"], [429, "Terlalu banyak"], [502, "belum tersedia"], [503, "belum tersedia"]])("shows safe copy for HTTP %s without reading error payloads", async (status, copy) => {
  const response = new Response('do-not-render-private-error', { status: Number(status) });
  const json = vi.spyOn(response, "json");
  await expect(requestDocument(id, new AbortController().signal, fetcher(response))).rejects.toThrow(String(copy));
  expect(json).not.toHaveBeenCalled();
});

it.each(["application/json", "text/html", "application/x-unknown"])("rejects HTTP 200 %s bodies instead of downloading error pages", async type => {
  await expect(requestDocument(id, new AbortController().signal, fetcher(new Response("error", { headers: { ...headers, "content-type": type } })))).rejects.toThrow("bukan file");
});

it("requires an attachment disposition", async () => {
  await expect(requestDocument(id, new AbortController().signal, fetcher(new Response("file", { headers: { "content-type": "application/pdf" } })))).rejects.toThrow("bukan file");
});

it("rejects oversized declared bodies before reading and cancels the stream", async () => {
  const cancel = vi.fn();
  const response = new Response(new ReadableStream({ cancel }), { headers: { ...headers, "content-length": String(sisterFileMaxBytes + 1) } });
  await expect(requestDocument(id, new AbortController().signal, fetcher(response))).rejects.toThrow("25 MiB");
  expect(cancel).toHaveBeenCalledOnce();
});

it("caps chunked bodies even without Content-Length", async () => {
  const cancel = vi.fn();
  const response = new Response(new ReadableStream({ start(c) { c.enqueue(new Uint8Array(sisterFileMaxBytes)); c.enqueue(new Uint8Array(1)); }, cancel }), { headers });
  await expect(requestDocument(id, new AbortController().signal, fetcher(response))).rejects.toThrow("25 MiB");
  expect(cancel).toHaveBeenCalledOnce();
});

it("does not start a request after cancellation", async () => {
  const controller = new AbortController(); controller.abort();
  const mock = fetcher(new Response("file", { headers }));
  await expect(requestDocument(id, controller.signal, mock)).rejects.toThrow();
  expect(mock).not.toHaveBeenCalled();
});

it("does not produce a blob after cancellation during a read", async () => {
  const controller = new AbortController();
  const cancel = vi.fn();
  const response = new Response(new ReadableStream({ pull(c) { c.enqueue(new Uint8Array([1])); controller.abort(); }, cancel }), { headers });
  await expect(requestDocument(id, controller.signal, fetcher(response))).rejects.toThrow();
  expect(cancel).toHaveBeenCalledOnce();
});

it("uses safe network error copy", async () => {
  const mock = vi.fn<typeof fetch>().mockRejectedValue(new Error("private transport details"));
  await expect(requestDocument(id, new AbortController().signal, mock)).rejects.toThrow("Periksa koneksi");
});

it("rejects invalid IDs and empty files", async () => {
  const mock = fetcher(new Response(null, { headers }));
  await expect(requestDocument("../secret", new AbortController().signal, mock)).rejects.toThrow("ID dokumen");
  expect(mock).not.toHaveBeenCalled();
  await expect(requestDocument(id, new AbortController().signal, mock)).rejects.toThrow("kosong");
});

it("sanitizes filesystem names and reserved device names", () => {
  expect(documentFilename('attachment; filename="../folder\\file.pdf"')).not.toMatch(/[/\\]/);
  expect(documentFilename('attachment; filename="NUL.pdf"')).toBe("dokumen-NUL.pdf");
  expect(documentFilename('attachment; filename=".."')).toBe("dokumen");
  expect(documentFilename(null)).toBe("dokumen");
});
