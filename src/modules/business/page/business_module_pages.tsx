"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/component/ui/page_shell";
import { Pagination } from "@/component/ui/pagination";
import { Select } from "@/component/ui/select";
import { State } from "@/component/ui/state";
import { Tabs } from "@/component/ui/tabs";
import { DataTable, type DataTableColumn } from "@/component/widget/data_table";
import { getJelajahModule, jelajahModules } from "@/modules/jelajah/api/jelajah_catalog";
import { useTRPC } from "@/lib/trpc";
import { asBusinessRows, emptyDescription, ErrorState, formatValue, labelFor, PageError, rowColumns, SdmPicker, SourceLine, useUrlState, type BusinessRow, type BusinessSection } from "./business_shared";

const profileModules = jelajahModules.filter((module) => module.kind === "sdm_object");
function recordLabel(values: Record<string, unknown> | undefined, fallback: string) {
  for (const key of ["nama_sdm", "nama", "judul", "judul_kegiatan", "nama_kegiatan", "nama_penghargaan", "nama_jabatan"]) {
    const value = values?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

function documentDownloadId(row: BusinessRow) {
  const id = row.values.id ?? row.values.id_dokumen;
  return typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function SdmDirectoryPage() {
  const trpc = useTRPC();
  const state = useUrlState();
  const [draft, setDraft] = useState("");
  useEffect(() => setDraft(state.values.search ?? ""), [state.values.search]);
  const page = Math.max(1, Number(state.values.page) || 1);
  const query = useQuery({ ...trpc.business.sdm.queryOptions({ search: state.values.search ?? "", page, per_page: 20 }), enabled: state.ready });
  const columns: DataTableColumn<BusinessRow>[] = [
    { key: "name", header: "Nama SDM", render: (row) => <Link className="font-semibold text-[hsl(var(--color-primary))] hover:underline" href={`/pegawai/${encodeURIComponent(String(row.values.id_sdm ?? row.id))}${state.values.tab ? `?tab=${encodeURIComponent(state.values.tab)}` : ""}`}>{formatValue(row.values.nama_sdm ?? row.values.nama)}</Link> },
    { key: "nidn", header: "NIDN", render: (row) => formatValue(row.values.nidn) },
    { key: "nip", header: "NIP", render: (row) => formatValue(row.values.nip) },
    { key: "type", header: "Jenis SDM", render: (row) => formatValue(row.values.jenis_sdm ?? row.values.nama_jenis_sdm) },
    { key: "status", header: "Status", render: (row) => formatValue(row.values.nama_status_aktif ?? row.values.status_aktif) },
  ];
  const submit = (event: FormEvent) => { event.preventDefault(); state.set({ search: draft.trim() || null, page: "1" }); };
  return (
    <PageShell activeLabel="Pegawai" breadcrumb={[{ href: "/", label: "Ikhtisar" }, { label: "Pegawai" }]}>
      <form className="flex flex-wrap items-end gap-2" onSubmit={submit}>
        <label className="min-w-[240px] flex-1"><span className="mb-1 block text-xs font-semibold text-[hsl(var(--color-muted))]">Cari nama, NIDN, NIP, atau NUPTK</span><input className="h-10 w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 text-sm outline-none focus:border-[hsl(var(--color-primary))]" onChange={(event) => setDraft(event.target.value)} value={draft} /></label>
        <button className="h-10 rounded-lg bg-[hsl(var(--color-primary))] px-4 text-sm font-semibold text-white" type="submit">Cari</button>
        {query.data && <SourceLine source={query.data.source} />}
      </form>
      {query.error && <ErrorState message={query.error.message} title="Daftar SDM belum dapat dimuat" />}
      {query.isPending && <PageError error={null} pending title="Daftar SDM belum dapat dimuat" />}
      {query.data && <DataTable caption="Daftar SDM PT" columns={columns} empty={emptyDescription(query.data.source)} getRowKey={(row) => row.id} rows={query.data.rows} pagination={<div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-[hsl(var(--color-muted))]">{query.data.total.toLocaleString("id-ID")} SDM</span><Pagination page={page} pageCount={Math.ceil(query.data.total / query.data.per_page)} onPageChange={(next) => state.set({ page: String(next) })} /></div>} />}
      {!query.data && !query.error && !query.isPending && <State description="Daftar SDM belum tersinkron ke replika PT." title="Replika SDM belum tersedia" tone="unavailable" />}
    </PageShell>
  );
}

export function SdmProfilePage({ idSdm, initialTab = "profil" }: { idSdm: string; initialTab?: string }) {
  const trpc = useTRPC();
  const state = useUrlState();
  const tab = profileModules.some((module) => module.key === state.values.tab) ? state.values.tab : initialTab;
  const current = getJelajahModule(tab) ?? profileModules[0];
  const page = Math.max(1, Number(state.values.page) || 1);
  const query = useQuery({ ...trpc.business.rows.queryOptions({ module: current.key, id_sdm: idSdm, page, per_page: 20, search: "" }), enabled: state.ready });
  const row = query.data?.rows[0];
  const scalar = query.data?.columns.filter((column) => column.type !== "jsonb") ?? [];
  return (
    <PageShell activeLabel={current.label} detailLabel={recordLabel(row?.values, "Data SDM")} breadcrumb={[{ href: "/", label: "Ikhtisar" }, { href: "/pegawai", label: "Pegawai" }, { label: "Data SDM" }]}>
      <div className="flex flex-wrap items-center gap-4 border-b border-[hsl(var(--color-border))] pb-4">
        <Image alt="Foto SDM" className="h-20 w-20 rounded-full border border-[hsl(var(--color-border))] object-cover" height={80} src={`/api/sister/file/foto/${encodeURIComponent(idSdm)}`} unoptimized width={80} />
        <div className="space-y-1"><p className="text-sm font-semibold">{String(row?.values.nama ?? "Profil SDM")}</p><p className="text-xs text-[hsl(var(--color-muted))]">ID SDM · {idSdm}</p><SourceLine source={query.data?.source ?? null} /></div>
      </div>
      <Tabs ariaLabel="Bagian data SDM" items={profileModules.map((module) => ({ value: module.key, label: module.label }))} onValueChange={(value) => state.set({ tab: value, page: "1" })} value={tab}>
        <div className="space-y-4 pt-4">
          {query.error && <ErrorState message={query.error.message} title="Data SDM belum dapat dimuat" />}
          {query.isPending && <PageError error={null} pending title="Data SDM" />}
          {!query.isPending && !query.error && !row && query.data?.source?.status === 404 && <State description="SISTER tidak menemukan data pada scope ini." title="Data tidak ditemukan" tone="unavailable" />}
          {!query.isPending && !query.error && !row && query.data?.source?.status === 200 && <State description={emptyDescription(query.data.source)} title="Belum ada data" />}
          {!query.isPending && !query.error && !row && query.data?.source && query.data.source.status !== 200 && query.data.source.status !== 404 && <ErrorState message={`Pembaruan replika gagal dengan HTTP ${query.data.source.status}.`} title="Data belum dapat dimuat" />}
          {!query.isPending && !query.error && !row && !query.data?.source && <State description={emptyDescription(null)} title="Replika belum tersedia" tone="unavailable" />}
          {row && <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">{scalar.map((column) => <div className="min-w-0 border-b border-[hsl(var(--color-border))] pb-3" key={column.key}><dt className="text-xs font-medium text-[hsl(var(--color-muted))]">{labelFor(column.key)}</dt><dd className="mt-1 break-words text-sm">{formatValue(row.values[column.key])}</dd></div>)}</dl>}
          {row && query.data?.related.map((section) => <section className="space-y-3" key={section.key}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-bold">{section.label}</h2><SourceLine source={section.source} /></div><DataTable caption={section.label} columns={section.columns.map((column) => ({ key: column.key, header: labelFor(column.key), render: (item: BusinessRow) => formatValue(item.values[column.key]) }))} empty="Tidak ada record terkait." getRowKey={(item) => item.id} rows={section.rows} pagination={<div className="flex items-center justify-between gap-3"><span className="text-xs text-[hsl(var(--color-muted))]">{section.total.toLocaleString("id-ID")} data</span><Pagination page={section.page} pageCount={Math.max(1, Math.ceil(section.total / section.per_page))} onPageChange={(next) => state.set({ page: String(next) })} /></div>} /></section>)}
          {current.note && <p className="text-xs text-[hsl(var(--color-muted))]">{current.note}</p>}
        </div>
      </Tabs>
    </PageShell>
  );
}

export function ReferenceDirectoryPage() {
  const references = jelajahModules.filter((module) => module.kind === "referensi");
  const searches = jelajahModules.filter((module) => module.kind === "search");
  const groups = [...new Set(references.map((module) => module.group))];
  return <PageShell activeLabel="Direktori referensi" breadcrumb={[{ href: "/", label: "Ikhtisar" }, { label: "Direktori referensi" }]}>
    {groups.map((group) => <section className="space-y-2" key={group}><h2 className="text-xs font-bold uppercase tracking-wide text-[hsl(var(--color-muted))]">{group}</h2><ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">{references.filter((module) => module.group === group).map((module) => <li className="border-b border-[hsl(var(--color-border))] py-2" key={module.key}><Link className="text-sm font-medium text-[hsl(var(--color-primary))] hover:underline" href={referenceHref(module)}>{module.label}</Link></li>)}</ul></section>)}
    <section className="space-y-2 border-t border-[hsl(var(--color-border))] pt-4"><h2 className="text-xs font-bold uppercase tracking-wide text-[hsl(var(--color-muted))]">Pencarian langsung</h2><ul className="flex flex-wrap gap-x-6 gap-y-2">{searches.map((module) => <li key={module.key}><Link className="text-sm font-medium text-[hsl(var(--color-primary))] hover:underline" href={module.path}>{module.label}</Link></li>)}</ul></section>
  </PageShell>;
}

function referenceHref(module: (typeof jelajahModules)[number]) {
  const params = new URLSearchParams(module.query ?? {}).toString();
  return `${module.path}${params ? `?${params}` : ""}`;
}

export function BusinessModulePage({ moduleKey, itemId }: { moduleKey: string; itemId?: string }) {
  const module = getJelajahModule(moduleKey);
  if (!module) return <PageShell breadcrumb={[{ href: "/", label: "Ikhtisar" }, { label: "Modul tidak ditemukan" }]}><State title="Modul tidak ditemukan" tone="unavailable" /></PageShell>;
  if (module.kind === "sdm_object") return <SdmProfilePage idSdm={itemId ?? ""} initialTab={module.key} />;
  if (module.kind === "search") return itemId ? <LiveDetailPage moduleKey={module.key} itemId={itemId} /> : <LiveSearchPage moduleKey={module.key} />;
  return itemId ? <BusinessDetailPage moduleKey={module.key} itemId={itemId} /> : <BusinessListPage moduleKey={module.key} />;
}

function BusinessListPage({ moduleKey }: { moduleKey: string }) {
  const trpc = useTRPC();
  const module = getJelajahModule(moduleKey)!;
  const state = useUrlState();
  const [draft, setDraft] = useState("");
  useEffect(() => setDraft(state.values.search ?? ""), [state.values.search]);
  const idSdm = state.values.id_sdm ?? "";
  const page = Math.max(1, Number(state.values.page) || 1);
  const scoped = module.kind !== "referensi";
  const query = useQuery({ ...trpc.business.rows.queryOptions({ module: module.key, id_sdm: idSdm || undefined, id_smt: state.values.id_smt, search: state.values.search ?? "", page, per_page: 20 }), enabled: state.ready && (!scoped || Boolean(idSdm)) });
  const submit = (event: FormEvent) => { event.preventDefault(); state.set({ search: draft.trim() || null, page: "1" }); };
  return <PageShell actions={scoped ? <SdmPicker enabled={state.ready} onChange={(id) => state.set({ id_sdm: id || null, page: "1" })} value={idSdm} /> : undefined} activeLabel={module.label} breadcrumb={[{ href: "/", label: "Ikhtisar" }, { label: module.label }]}>
    {module.note && <p className="text-xs text-[hsl(var(--color-muted))]">{module.note}</p>}
    {scoped && !idSdm && <State description="Pilih SDM dari indeks replika PT untuk membuka daftar modul." title="Pilih SDM" tone="unavailable" />}
    {(!scoped || idSdm) && <>
      {query.data && <SourceLine source={query.data.source} />}
      <form className="flex flex-wrap items-end gap-2" onSubmit={submit}><label className="min-w-[220px] flex-1"><span className="mb-1 block text-xs font-semibold text-[hsl(var(--color-muted))]">Cari pada kolom modul</span><input className="h-10 w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 text-sm outline-none focus:border-[hsl(var(--color-primary))]" onChange={(event) => setDraft(event.target.value)} value={draft} /></label><button className="h-10 rounded-lg bg-[hsl(var(--color-primary))] px-4 text-sm font-semibold text-white" type="submit">Cari</button>{state.values.search && <button className="h-10 px-3 text-sm text-[hsl(var(--color-muted))]" onClick={() => state.set({ search: null, page: "1" })} type="button">Hapus filter</button>}</form>
      {query.error && <ErrorState message={query.error.message} title={`${module.label} belum dapat dimuat`} />}
      {query.isPending && <PageError error={null} pending title={`Memuat ${module.label}`} />}
      {query.data && <DataTable caption={module.label} columns={rowColumns(module.key, query.data.columns, idSdm)} empty={emptyDescription(query.data.source)} getRowKey={(row) => row.id} rows={query.data.rows} pagination={<div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-[hsl(var(--color-muted))]">{query.data.total.toLocaleString("id-ID")} data</span><Pagination page={page} pageCount={Math.ceil(query.data.total / query.data.per_page)} onPageChange={(next) => state.set({ page: String(next) })} /></div>} />}
    </>}
  </PageShell>;
}

function BusinessDetailPage({ moduleKey, itemId }: { moduleKey: string; itemId: string }) {
  const trpc = useTRPC();
  const module = getJelajahModule(moduleKey)!;
  const state = useUrlState();
  const idSdm = state.values.id_sdm ?? "";
  const query = useQuery({ ...trpc.business.detail.queryOptions({ module: module.key, id: itemId, id_sdm: idSdm || undefined, page: Math.max(1, Number(state.values.page) || 1), per_page: 20 }), enabled: state.ready && (module.kind === "referensi" || Boolean(idSdm)) });
  const detailValues = query.data?.sections.find((section) => section.key === "detail")?.rows[0]?.values;
  return <PageShell actions={module.kind !== "referensi" ? <SdmPicker enabled={state.ready} onChange={(id) => state.set({ id_sdm: id || null, page: "1" })} value={idSdm} /> : undefined} activeLabel={module.label} detailLabel={recordLabel(detailValues, itemId)} breadcrumb={[{ href: "/", label: "Ikhtisar" }, { href: module.path, label: module.label }, { label: "Detail" }]}>
    {module.kind !== "referensi" && !idSdm && <State description="Pilih SDM yang memiliki record ini." title="Pilih SDM" tone="unavailable" />}
    {query.error && <ErrorState message={query.error.message} title={`Detail ${module.label} belum dapat dimuat`} />}
    {state.ready && query.isPending && (module.kind === "referensi" || Boolean(idSdm)) && <PageError error={null} pending title={`Memuat detail ${module.label}`} />}
    {query.data?.sections.map((section) => <DetailSection key={section.key} moduleKey={module.key} itemId={itemId} section={section} onPageChange={(next) => state.set({ page: String(next) })} />)}
  </PageShell>;
}

function DetailSection({ moduleKey, itemId, section, onPageChange = () => {} }: { moduleKey: string; itemId: string; section: BusinessSection; onPageChange?: (page: number) => void }) {
  const primary = section.rows[0];
  const isDetail = section.key === "detail";
  const download = moduleKey === "dokumen" || section.label.toLowerCase().includes("dokumen");
  const columns: DataTableColumn<BusinessRow>[] = section.columns.map((column) => ({ key: column.key, header: labelFor(column.key), render: (row) => formatValue(row.values[column.key]) }));
  if (download && section.rows.some((row) => documentDownloadId(row))) columns.push({ key: "file", header: "", className: "w-24 text-right", render: (row) => { const id = documentDownloadId(row); return id ? <a className="font-semibold text-[hsl(var(--color-primary))] hover:underline" href={`/api/sister/file/dokumen/${encodeURIComponent(id)}`} rel="noreferrer" target="_blank">Unduh</a> : <span className="text-xs text-[hsl(var(--color-muted))]">—</span>; } });
  return <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-bold">{section.label}</h2><SourceLine source={section.source} /></div>
    {isDetail && primary && <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">{section.columns.map((column) => <div className="min-w-0 border-b border-[hsl(var(--color-border))] pb-3" key={column.key}><dt className="text-xs font-medium text-[hsl(var(--color-muted))]">{labelFor(column.key)}</dt><dd className="mt-1 break-words text-sm">{formatValue(primary.values[column.key])}</dd></div>)}</dl>}
    {isDetail && primary && download && !isUuid(itemId) && <State description="Metadata ini tidak memiliki ID file yang valid untuk diunduh." title="Unduhan tidak tersedia" tone="unavailable" />}
    {isDetail && !primary && section.source?.status === 404 && <State description={emptyDescription(section.source)} title="Detail tidak ditemukan" tone="unavailable" />}
    {isDetail && !primary && section.source?.status !== 404 && <State description={emptyDescription(section.source)} title="Detail belum tersedia" tone={section.source && section.source.status !== 200 ? "error" : "unavailable"} />}
    {!isDetail && <DataTable caption={section.label} columns={columns} empty={emptyDescription(section.source)} getRowKey={(row) => row.id} rows={section.rows} pagination={<div className="flex items-center justify-between gap-3"><span className="text-xs text-[hsl(var(--color-muted))]">{section.total.toLocaleString("id-ID")} data</span><Pagination page={section.page} pageCount={Math.max(1, Math.ceil(section.total / section.per_page))} onPageChange={onPageChange} /></div>} />}
    {isDetail && primary && download && isUuid(itemId) && <a className="inline-flex h-9 items-center rounded-lg border border-[hsl(var(--color-border))] px-3 text-sm font-semibold text-[hsl(var(--color-primary))]" href={`/api/sister/file/dokumen/${encodeURIComponent(itemId)}`} rel="noreferrer" target="_blank">Unduh dokumen</a>}
  </section>;
}

function LiveSearchPage({ moduleKey }: { moduleKey: string }) {
  const trpc = useTRPC();
  const module = getJelajahModule(moduleKey)!;
  const state = useUrlState();
  const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => setDraft(Object.fromEntries((module.searchFields ?? []).map((field) => [field.name, state.values[field.name] ?? ""]))), [state.ready, state.values, module]);
  const search = Object.fromEntries((module.searchFields ?? []).map((field) => [field.name, state.values[field.name] ?? ""]));
  const hasSearch = Boolean(module.searchFields?.some((field) => search[field.name]));
  const query = useQuery({ ...trpc.business.live_search.queryOptions({ module: module.key, search }), enabled: state.ready && hasSearch });
  const submit = (event: FormEvent) => { event.preventDefault(); state.set({ ...Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim() || null])), page: null }); };
  const rows = asBusinessRows(query.data?.data);
  const resultColumns: DataTableColumn<BusinessRow>[] = [...new Set(rows.flatMap((row) => Object.keys(row.values)))].filter((key) => !key.startsWith("r_")).map((key) => ({ key, header: labelFor(key), render: (row) => formatValue(row.values[key]) }));
  if (module.detailPath) resultColumns.push({ key: "detail", header: "", render: (row: BusinessRow) => row.values.id ? <Link className="font-semibold text-[hsl(var(--color-primary))]" href={module.detailPath!.replace("{id}", encodeURIComponent(row.id))}>Lihat detail</Link> : "" });
  return <PageShell activeLabel={module.label} breadcrumb={[{ href: "/", label: "Ikhtisar" }, { href: "/referensi", label: "Referensi" }, { label: module.label }]}>
    <form className="flex flex-wrap items-end gap-3" onSubmit={submit}>{module.searchFields?.map((field) => <label className="min-w-[220px] flex-1" key={field.name}><span className="mb-1 block text-xs font-semibold text-[hsl(var(--color-muted))]">{field.label}{field.required ? " *" : ""}</span>{field.input === "prodi" ? <ProgramStudySelect onChange={(value) => setDraft((prev) => ({ ...prev, [field.name]: value }))} value={draft[field.name] ?? ""} /> : <input className="h-10 w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 text-sm outline-none focus:border-[hsl(var(--color-primary))]" onChange={(event) => setDraft((prev) => ({ ...prev, [field.name]: event.target.value }))} required={field.required} value={draft[field.name] ?? ""} />}</label>)}<button className="h-10 rounded-lg bg-[hsl(var(--color-primary))] px-4 text-sm font-semibold text-white" type="submit">Cari di SISTER</button></form>
    {module.note && <p className="text-xs text-[hsl(var(--color-muted))]">{module.note}</p>}
    {!hasSearch && <State description="Masukkan kriteria pencarian untuk meminta hasil langsung dari SISTER." title="Pencarian langsung" tone="unavailable" />}
    {query.error && <ErrorState message={query.error.message} title="Pencarian SISTER gagal" />}{query.isPending && hasSearch && <PageError error={null} pending title="Pencarian SISTER" />}
    {query.data && <><SourceLine source={{ status: 200, error_code: null, item_count: query.data.item_count, last_fetched_at: query.data.fetched_at, last_success_at: query.data.fetched_at }} /><DataTable caption={module.label} columns={resultColumns} empty="Tidak ada hasil dari SISTER." getRowKey={(row) => row.id} rows={rows} /></>}
  </PageShell>;
}

function ProgramStudySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery(trpc.business.rows.queryOptions({ module: "ref_unit_kerja", search, page, per_page: 20 }));
  const options = (query.data?.rows ?? []).map((row) => ({ value: String(row.values.id_program_studi ?? row.values.id_unit_kerja ?? row.id), label: String(row.values.nama_program_studi ?? row.values.nama_unit_kerja ?? row.values.nama ?? row.id) }));
  return <div className="space-y-2">
    <input aria-label="Cari program studi" className="h-9 w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 text-sm outline-none focus:border-[hsl(var(--color-primary))]" onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari program studi" value={search} />
    <Select ariaLabel="Pilih program studi" disabled={query.isPending || query.isError} onValueChange={onChange} options={options} placeholder="Pilih program studi" value={value} />
    {query.data && <div className="flex items-center justify-between gap-2 text-xs text-[hsl(var(--color-muted))]"><span>{query.data.total.toLocaleString("id-ID")} program studi</span><Pagination page={page} pageCount={Math.max(1, Math.ceil(query.data.total / query.data.per_page))} onPageChange={setPage} /></div>}
  </div>;
}

function LiveDetailPage({ moduleKey, itemId }: { moduleKey: string; itemId: string }) {
  const trpc = useTRPC();
  const module = getJelajahModule(moduleKey)!;
  const query = useQuery(trpc.business.live_detail.queryOptions({ module: module.key, id: itemId }));
  const rows = asBusinessRows(query.data?.data);
  const detailValues = rows[0]?.values;
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row.values)))].filter((key) => !key.startsWith("r_"));
  const section: BusinessSection = { key: "detail", label: "Detail", endpoint: module.detailPath ?? module.path, columns: keys.map((key) => ({ key, type: "text" })), rows, total: rows.length, page: 1, per_page: rows.length || 1, source: query.data ? { status: 200, error_code: null, item_count: query.data.item_count, last_fetched_at: query.data.fetched_at, last_success_at: query.data.fetched_at } : null };
  return <PageShell activeLabel={module.label} detailLabel={recordLabel(detailValues, itemId)} breadcrumb={[{ href: "/", label: "Ikhtisar" }, { href: module.path, label: module.label }, { label: "Detail" }]}>{query.error && <ErrorState message={query.error.message} title="Detail SISTER gagal dimuat" />}{query.isPending && <PageError error={null} pending title="Detail SISTER" />}{query.data && <DetailSection itemId={itemId} moduleKey={module.key} section={section} />}</PageShell>;
}