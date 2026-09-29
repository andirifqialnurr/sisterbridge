"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Database } from "lucide-react";

import { PageShell } from "@/component/ui/page_shell";
import { State } from "@/component/ui/state";
import { DataExplorerView, DetailButton } from "@/component/widget/data_explorer_view";
import { ModuleNav } from "@/component/widget/module_nav";
import { DokumenDownloadLink, SdmPhoto } from "@/component/widget/sister_file_links";
import { useTRPC } from "@/lib/trpc";

import { ReplikaItemPanel } from "../widget/replika_item_panel";
import { ReplikaSdmPicker } from "../widget/replika_sdm_picker";

// Items whose related table is keyed by another field of the row.
const childSourceFields: Record<string, string> = { pengajaran: "id_kelas" };

export function ReplikaPage() {
  const trpc = useTRPC();
  const [moduleKey, setModuleKey] = useState("penugasan");
  const [sdmId, setSdmId] = useState("");
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);

  const modulesQuery = useQuery(
    trpc.replika.modules.queryOptions({ id_sdm: sdmId || undefined }),
  );
  const selected = modulesQuery.data?.find((module) => module.key === moduleKey);
  const needsSdm = selected !== undefined && selected.kind !== "referensi";

  const rowsQuery = useQuery({
    ...trpc.replika.rows.queryOptions({
      module: moduleKey,
      id_sdm: needsSdm ? sdmId || undefined : undefined,
    }),
    enabled: selected !== undefined && (!needsSdm || Boolean(sdmId)),
  });

  return (
    <PageShell
      actions={
        <ReplikaSdmPicker
          onChange={(next) => {
            setSdmId(next);
            setSelectedRow(null);
          }}
          value={sdmId}
        />
      }
      activeLabel="Data Replika"
      breadcrumb={[{ href: "/", label: "Ikhtisar" }, { label: "Data Replika" }]}
    >
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="shrink-0 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-64 lg:self-start lg:overflow-y-auto lg:pr-1">
          {modulesQuery.isPending && <State title="Memuat modul..." tone="loading" />}
          {modulesQuery.isError && (
            <State description={modulesQuery.error.message} title="Modul belum dapat dimuat" tone="error" />
          )}
          {modulesQuery.data && (
            <ModuleNav
              modules={modulesQuery.data}
              onChange={(next) => {
                setModuleKey(next);
                setSelectedRow(null);
              }}
              value={moduleKey}
            />
          )}
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          {selected && (
            <header className="space-y-1">
              <h1 className="text-lg font-bold text-[hsl(var(--color-text))]">{selected.label}</h1>
              <p className="text-sm text-[hsl(var(--color-muted))]">
                Dibaca dari replika lokal (<code>{selected.view}</code>), bukan SISTER live. Data sebaru
                sinkronisasi terakhir; waktu pengambilan tampil di atas tabel.
              </p>
            </header>
          )}

          {needsSdm && !sdmId && (
            <State
              description="Modul ini dibaca per SDM. Pilih SDM di kanan atas."
              icon={<Database aria-hidden size={18} />}
              title="Pilih SDM terlebih dahulu"
            />
          )}
          {moduleKey === "profil" && sdmId && <SdmPhoto idSdm={sdmId} />}
          {rowsQuery.isFetching && !rowsQuery.data && <State title="Membaca replika..." tone="loading" />}
          {rowsQuery.isError && (
            <State description={rowsQuery.error.message} title="Data replika belum dapat dimuat" tone="error" />
          )}
          {rowsQuery.data && selected && (
            <>
              {rowsQuery.data.truncated && (
                <p className="text-xs text-[hsl(var(--color-muted))]">
                  Menampilkan {rowsQuery.data.item_count} baris pertama.
                </p>
              )}
              {rowsQuery.data.item_count === 0 && needsSdm && (
                <p className="text-xs text-[hsl(var(--color-muted))]">
                  Belum ada data di replika untuk SDM ini. Bisa jadi memang kosong di SISTER, atau SDM
                  ini belum tersinkron.
                </p>
              )}
              <DataExplorerView
                key={`${moduleKey}-${sdmId}`}
                result={rowsQuery.data}
                rowAction={
                  selected.has_item || moduleKey === "dokumen"
                    ? (row) => (
                        <div className="flex justify-end gap-2">
                          {moduleKey === "dokumen" && <DokumenDownloadLink id={row.id} />}
                          {selected.has_item && <DetailButton onClick={() => setSelectedRow(row)} />}
                        </div>
                      )
                    : undefined
                }
                sourceLabel={rowsQuery.data.endpoint}
                title={selected.label}
              />
            </>
          )}

          {selectedRow && selected && (
            <ReplikaItemPanel
              key={`${moduleKey}-${String(selectedRow.id)}`}
              moduleKey={moduleKey}
              moduleLabel={selected.label}
              onClose={() => setSelectedRow(null)}
              row={selectedRow}
              sourceField={childSourceFields[moduleKey]}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
