"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";

import { PageShell } from "@/component/ui/page_shell";
import { State } from "@/component/ui/state";
import { DataExplorerView, DetailButton } from "@/component/widget/data_explorer_view";
import { ModuleNav } from "@/component/widget/module_nav";
import { DokumenDownloadLink, SdmPhoto } from "@/component/widget/sister_file_links";
import { useTRPC } from "@/lib/trpc";

import { JelajahDetailPanel } from "../widget/jelajah_detail_panel";
import { JelajahSdmPicker } from "../widget/jelajah_sdm_picker";
import { JelajahSearchForm, type JelajahSearchValues } from "../widget/jelajah_search_form";

export function JelajahPage() {
  const trpc = useTRPC();
  const [moduleKey, setModuleKey] = useState("penugasan");
  const [sdmId, setSdmId] = useState("");
  const [search, setSearch] = useState<JelajahSearchValues | null>(null);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);

  const modulesQuery = useQuery(trpc.jelajah.modules.queryOptions());
  const selected = modulesQuery.data?.find((module) => module.key === moduleKey);
  const needsSdm = selected?.kind === "sdm_list" || selected?.kind === "sdm_object";
  const isSearch = selected?.kind === "search";

  const listQuery = useQuery({
    ...trpc.jelajah.list.queryOptions({
      module: moduleKey,
      id_sdm: needsSdm ? sdmId || undefined : undefined,
      search: isSearch ? (search ?? undefined) : undefined,
    }),
    enabled: selected !== undefined && (!needsSdm || Boolean(sdmId)) && (!isSearch || search !== null),
    // Each view is a live SISTER request; keep results for a while so
    // switching back and forth does not re-query.
    staleTime: 5 * 60 * 1000,
  });

  const hasRowActions =
    selected !== undefined &&
    selected.kind !== "sdm_object" &&
    (selected.has_detail || selected.children.length > 0);

  function rowAction(row: Record<string, unknown>) {
    return (
      <div className="flex justify-end gap-2">
        {moduleKey === "dokumen" && <DokumenDownloadLink id={row.id} />}
        {hasRowActions && <DetailButton onClick={() => setSelectedRow(row)} />}
      </div>
    );
  }

  return (
    <PageShell
      actions={
        <JelajahSdmPicker
          onChange={(next) => {
            setSdmId(next);
            setSelectedRow(null);
          }}
          value={sdmId}
        />
      }
      activeLabel="Jelajah Data"
      breadcrumb={[{ href: "/", label: "Ikhtisar" }, { label: "Jelajah Data SISTER" }]}
    >
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="shrink-0 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-64 lg:self-start lg:overflow-y-auto lg:pr-1">
          {modulesQuery.isPending && <State title="Memuat katalog modul..." tone="loading" />}
          {modulesQuery.isError && (
            <State description={modulesQuery.error.message} title="Katalog belum dapat dimuat" tone="forbidden" />
          )}
          {modulesQuery.data && (
            <ModuleNav
              modules={modulesQuery.data}
              onChange={(next) => {
                setModuleKey(next);
                setSearch(null);
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
                Data live dari SISTER (read-only).{" "}
                {selected.paginated ? "Semua halaman digabung. " : ""}
                {selected.note ?? ""}
              </p>
            </header>
          )}

          {needsSdm && !sdmId && (
            <State
              description="Modul ini membaca data per SDM. Pilih SDM di kanan atas."
              icon={<Compass aria-hidden size={18} />}
              title="Pilih SDM terlebih dahulu"
            />
          )}
          {isSearch && selected && (
            <JelajahSearchForm
              fields={selected.search_fields}
              key={moduleKey}
              onSubmit={(values) => {
                setSearch(values);
                setSelectedRow(null);
              }}
            />
          )}
          {moduleKey === "profil" && sdmId && <SdmPhoto idSdm={sdmId} />}

          {listQuery.isFetching && !listQuery.data && <State title="Mengambil data dari SISTER..." tone="loading" />}
          {listQuery.isError && (
            <State description={listQuery.error.message} title="Data belum dapat dimuat" tone="error" />
          )}
          {listQuery.data && selected && (
            <DataExplorerView
              key={`${moduleKey}-${sdmId}-${JSON.stringify(search)}`}
              result={listQuery.data}
              rowAction={hasRowActions || moduleKey === "dokumen" ? rowAction : undefined}
              title={selected.label}
            />
          )}

          {selectedRow && selected && (
            <JelajahDetailPanel
              childEndpoints={selected.children}
              hasDetail={selected.has_detail}
              key={`${moduleKey}-${String(selectedRow.id)}`}
              moduleKey={moduleKey}
              moduleLabel={selected.label}
              onClose={() => setSelectedRow(null)}
              row={selectedRow}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
