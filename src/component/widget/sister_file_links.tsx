"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DocumentDownloadError, isDocumentId, requestDocument } from "@/lib/document_download";

import { Download, UserRound } from "lucide-react";

// Links to the server file routes (/api/sister/file/*); the browser never
// talks to SISTER directly.

export function DokumenDownloadLink({ id, label = "Unduh" }: { id: unknown; label?: string }) {
  return isDocumentId(id) ? <DocumentDownloadButton key={id} id={id} label={label} /> : null;
}

function DocumentDownloadButton({ id, label }: { id: string; label: string }) {
  const descriptionId = useId();
  const controller = useRef<AbortController | null>(null);
  const objectUrl = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => () => {
    controller.current?.abort();
    if (timer.current) clearTimeout(timer.current);
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  async function download() {
    if (controller.current) return;
    const current = new AbortController();
    controller.current = current;
    setPending(true); setError(null); setStarted(false);
    try {
      const file = await requestDocument(id, current.signal);
      if (current.signal.aborted) return;
      if (timer.current) clearTimeout(timer.current);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      const url = URL.createObjectURL(file.blob);
      objectUrl.current = url;
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = file.filename;
      try { document.body.appendChild(anchor); anchor.click(); }
      finally {
        anchor.remove();
        timer.current = setTimeout(() => { URL.revokeObjectURL(url); objectUrl.current = null; }, 1000);
      }
      setStarted(true);
    } catch (cause) {
      if (!current.signal.aborted) setError(cause instanceof DocumentDownloadError ? cause.message : "Unduhan gagal. Coba lagi nanti.");
    } finally {
      if (!current.signal.aborted) { controller.current = null; setPending(false); }
    }
  }
  return <span className="inline-flex max-w-64 flex-col items-start gap-1 text-left align-top">
    <button aria-busy={pending} aria-describedby={error || started ? descriptionId : undefined} data-sister-download disabled={pending} onClick={download} type="button"
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 text-xs font-semibold text-[hsl(var(--color-text))] hover:bg-[hsl(var(--color-primary-soft))] disabled:cursor-wait disabled:opacity-60">
      <Download aria-hidden size={13} />{pending ? "Menyiapkan…" : label}
    </button>
    {error && <span className="whitespace-normal break-words text-xs text-[hsl(var(--color-danger-strong))]" id={descriptionId} role="alert">{error}</span>}
    {started && <span className="text-xs text-[hsl(var(--color-muted))]" id={descriptionId} role="status">Unduhan dimulai.</span>}
  </span>;
}

export function SdmPhoto({ idSdm, name }: { idSdm: string; name?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-label="Foto tidak tersedia"
        className="flex h-28 w-24 items-center justify-center rounded-lg border border-dashed border-[hsl(var(--color-border))] text-[hsl(var(--color-muted))]"
        role="img"
      >
        <UserRound aria-hidden size={28} />
      </div>
    );
  }

  return (
    // Plain <img>: the route streams a private, non-cacheable SISTER photo,
    // which the Next image optimizer must not fetch or cache.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={name ? `Foto ${name}` : "Foto SDM"}
      className="h-28 w-24 rounded-lg border border-[hsl(var(--color-border))] object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
      src={`/api/sister/file/foto/${encodeURIComponent(idSdm)}`}
    />
  );
}
