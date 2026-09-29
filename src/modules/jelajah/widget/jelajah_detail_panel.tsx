"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { Button } from "@/component/ui/button";
import { State } from "@/component/ui/state";
import { useTRPC } from "@/lib/trpc";

import { DataExplorerView } from "@/component/widget/data_explorer_view";
import { DokumenDownloadLink } from "@/component/widget/sister_file_links";

type ChildSummary = {
  key: "bidang_ilmu" | "kelas_dokumen" | "detail_unit_kerja";
  label: string;
  source_field: string;
};

type JelajahDetailPanelProps = {
  moduleKey: string;
  moduleLabel: string;
  hasDetail: boolean;
  childEndpoints: ChildSummary[];
  row: Record<string, unknown>;
  onClose: () => void;
};

function idFrom(source: Record<string, unknown> | null | undefined, field: string) {
  const value = source?.[field];
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function ChildSection({
  child,
  id,
  moduleKey,
}: {
  child: ChildSummary;
  id: string;
  moduleKey: string;
}) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const childQuery = useQuery({
    ...trpc.jelajah.child.queryOptions({ module: moduleKey, child: child.key, id }),
    enabled: open,
  });

  return (
    <section className="space-y-2 border-t border-[hsl(var(--color-border))] pt-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[hsl(var(--color-text))]">{child.label}</h3>
        {!open && (
          <Button onClick={() => setOpen(true)} size="sm" variant="secondary">
            Muat
          </Button>
        )}
      </div>
      {open && childQuery.isPending && <State title={`Memuat ${child.label.toLowerCase()}...`} tone="loading" />}
      {open && childQuery.isError && (
        <State description={childQuery.error.message} title={`${child.label} belum dapat dimuat`} tone="error" />
      )}
      {childQuery.data && (
        <DataExplorerView
          result={childQuery.data}
          rowAction={child.key === "kelas_dokumen" ? (row) => <DokumenDownloadLink id={row.id} /> : undefined}
          title={child.label}
        />
      )}
    </section>
  );
}

export function JelajahDetailPanel({
  childEndpoints,
  hasDetail,
  moduleKey,
  moduleLabel,
  onClose,
  row,
}: JelajahDetailPanelProps) {
  const trpc = useTRPC();
  const rowId = idFrom(row, "id");
  const detailQuery = useQuery({
    ...trpc.jelajah.detail.queryOptions({ module: moduleKey, id: rowId ?? "-" }),
    enabled: hasDetail && rowId !== null,
  });
  const detailRecord = (detailQuery.data?.data ?? null) as Record<string, unknown> | null;

  return (
    <section className="space-y-4 rounded-xl border border-[hsl(var(--color-primary))]/30 bg-[hsl(var(--color-surface))] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[hsl(var(--color-primary-strong))]">
            Detail {moduleLabel}
          </p>
          <p className="mt-1 font-mono text-xs text-[hsl(var(--color-muted))]">id: {rowId ?? "-"}</p>
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

      {hasDetail && detailQuery.isPending && <State title="Memuat detail..." tone="loading" />}
      {hasDetail && detailQuery.isError && (
        <State description={detailQuery.error.message} title="Detail belum dapat dimuat" tone="error" />
      )}
      {detailQuery.data && <DataExplorerView result={detailQuery.data} title={`${moduleLabel} (detail)`} />}

      {childEndpoints.map((child) => {
        // Children keyed by another field (e.g. id_kelas) read it from the
        // detail when there is one, otherwise from the list row.
        const source = child.source_field === "id" ? row : (detailRecord ?? row);
        const childId = idFrom(source, child.source_field);
        if (!childId) {
          return hasDetail && detailQuery.isPending ? null : (
            <p className="text-xs text-[hsl(var(--color-muted))]" key={child.key}>
              {child.label}: field <code>{child.source_field}</code> tidak tersedia.
            </p>
          );
        }
        return <ChildSection child={child} id={childId} key={`${child.key}-${childId}`} moduleKey={moduleKey} />;
      })}
    </section>
  );
}
