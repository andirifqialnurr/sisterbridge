"use client";

import { useState } from "react";

import { Download, UserRound } from "lucide-react";

// Links to the server file routes (/api/sister/file/*); the browser never
// talks to SISTER directly.

export function DokumenDownloadLink({ id }: { id: unknown }) {
  if (typeof id !== "string" || id.length === 0) {
    return null;
  }
  return (
    <a
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 text-xs font-semibold text-[hsl(var(--color-text))] hover:bg-[hsl(var(--color-primary-soft))]"
      href={`/api/sister/file/dokumen/${encodeURIComponent(id)}`}
      rel="noopener"
    >
      <Download aria-hidden size={13} />
      Unduh
    </a>
  );
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
