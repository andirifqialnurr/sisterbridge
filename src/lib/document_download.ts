import { sisterFileContentTypes, sisterFileMaxBytes } from "./sister_file_policy";

export class DocumentDownloadError extends Error {}
export function isDocumentId(id: unknown): id is string {
  return typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function documentFilename(header: string | null) {
  const match = header?.match(/filename="([^"]+)"/i);
  let name = (match?.[1] ?? "dokumen").replace(/[<>:"|?*\x00-\x1f\x7f/\\]/g, "_").slice(0, 150).replace(/^[. ]+|[. ]+$/g, "");
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) name = `dokumen-${name}`;
  return name || "dokumen";
}

function statusMessage(status: number) {
  if (status === 401) return "Sesi berakhir. Masuk kembali untuk mengunduh dokumen.";
  if (status === 403) return "Role Anda tidak diizinkan mengunduh dokumen.";
  if (status === 404) return "Dokumen belum tersedia pada integrasi aktif.";
  if (status === 429) return "Terlalu banyak permintaan. Coba lagi nanti.";
  return "Dokumen dari SISTER belum tersedia. Coba lagi nanti.";
}

// Never cache blobs or render upstream error bodies. The caller owns the
// AbortController so unmount/session changes cancel outstanding work.
export async function requestDocument(id: string, signal: AbortSignal, fetcher: typeof fetch = fetch) {
  if (!isDocumentId(id)) throw new DocumentDownloadError("ID dokumen tidak valid.");
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(90_000)]);
  try {
    deadline.throwIfAborted();
    const response = await fetcher(`/api/sister/file/dokumen/${encodeURIComponent(id)}`, {
      method: "GET", credentials: "same-origin", cache: "no-store", redirect: "error", signal: deadline,
    });
    async function reject(message: string): Promise<never> {
      await response.body?.cancel().catch(() => {});
      throw new DocumentDownloadError(message);
    }
    if (!response.ok) return await reject(statusMessage(response.status));
    const type = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    const disposition = response.headers.get("content-disposition");
    if (!sisterFileContentTypes.some(allowed => allowed === type) || !/^attachment;/i.test(disposition ?? "")) {
      return await reject("Respons unduhan bukan file yang didukung.");
    }
    if (Number(response.headers.get("content-length")) > sisterFileMaxBytes) return await reject("Ukuran dokumen melebihi batas 25 MiB.");
    if (!response.body) throw new DocumentDownloadError("File dokumen kosong.");
    const reader = response.body.getReader();
    const buffers: ArrayBuffer[] = [];
    let total = 0;
    try {
      while (true) {
        deadline.throwIfAborted();
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > sisterFileMaxBytes) throw new DocumentDownloadError("Ukuran dokumen melebihi batas 25 MiB.");
        buffers.push(new Uint8Array(value).buffer);
      }
      deadline.throwIfAborted();
      if (!total) throw new DocumentDownloadError("File dokumen kosong.");
      return { blob: new Blob(buffers, { type }), filename: documentFilename(disposition) };
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  } catch (error) {
    if (signal.aborted) throw error;
    if (error instanceof DocumentDownloadError) throw error;
    throw new DocumentDownloadError("Unduhan gagal. Periksa koneksi lalu coba lagi.");
  }
}
