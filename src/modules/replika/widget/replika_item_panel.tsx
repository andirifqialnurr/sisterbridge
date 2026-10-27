"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { State } from "@/component/ui/state";
import { DataExplorerView } from "@/component/widget/data_explorer_view";
import { DokumenDownloadLink } from "@/component/widget/sister_file_links";
import { useTRPC } from "@/lib/trpc";

type ReplikaItemPanelProps = {
  moduleKey: string;
  moduleLabel: string;
  row: Record<string, unknown>;
  onClose: () => void;
};

function asId(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

export function ReplikaItemPanel({ moduleKey, moduleLabel, onClose, row }: ReplikaItemPanelProps) {
  const trpc = useTRPC();
  const id = asId(row.id) ?? "-";
  const [pages, setPages] = useState<Record<string, number>>({});
  const itemQuery = useQuery(
    trpc.replika.item.queryOptions({
      module: moduleKey,
      id,
      id_sdm: asId(row.r_id_sdm),
      section_pages: pages,
      per_page: 25,
    }),
  );

  return (
    <section className="space-y-4 rounded-xl border border-[hsl(var(--color-primary))]/30 bg-[hsl(var(--color-surface))] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[hsl(var(--color-primary-strong))]">
            Detail {moduleLabel}
          </p>
          <p className="mt-1 font-mono text-xs text-[hsl(var(--color-muted))]">id: {id}</p>
        </div>
        <button
          aria-label="Tutup detail"
          className="rounded-lg p-1.5 text-[hsl(var(--color-muted))] hover:bg-[hsl(var(--color-canvas))]"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden size={16} />
        </button>
      </div>

      {itemQuery.isPending && <State title="Memuat detail dari replika..." tone="loading" />}
      {itemQuery.isError && (
        <State description={itemQuery.error.message} title="Detail belum dapat dimuat" tone="error" />
      )}
      {itemQuery.data?.sections.length === 0 && (
        <p className="text-sm text-[hsl(var(--color-muted))]">Tidak ada data turunan untuk item ini.</p>
      )}
      {itemQuery.data?.sections.map((section) => (
        <div className="space-y-2 border-t border-[hsl(var(--color-border))] pt-4 first:border-t-0 first:pt-0" key={section.key}>
          <h3 className="text-sm font-semibold capitalize text-[hsl(var(--color-text))]">{section.label}</h3>
          <DataExplorerView
            result={section.result}
            pagination={section.key === "detail" ? undefined : { page: section.result.page, pageCount: Math.ceil(section.result.total / section.result.per_page), total: section.result.total, onPageChange: (next) => setPages((previous) => ({ ...previous, [section.key]: next })), disabled: itemQuery.isFetching }}
            // Document tables (module dokumen arrays, kelas kuliah) get a
            // download link through the server file route.
            rowAction={
              section.key.endsWith("_dokumen") || section.key === "kelas_dokumen" || (moduleKey === "dokumen" && section.key === "detail")
                ? (row) => <DokumenDownloadLink id={row.id} />
                : undefined
            }
            sourceLabel={section.result.endpoint}
            title={`${moduleLabel} - ${section.label}`}
          />
        </div>
      ))}
    </section>
  );
}
