"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/component/ui/page_shell";
import { Pagination } from "@/component/ui/pagination";
import { State } from "@/component/ui/state";
import { Tabs } from "@/component/ui/tabs";
import { ChartCard } from "@/component/widget/chart_card";
import { DataTable, type DataTableColumn } from "@/component/widget/data_table";
import { BkdSemesterChart, LuaranTrendChart, StatusBarChart } from "@/modules/overview/widget/overview_charts";
import { useTRPC } from "@/lib/trpc";
import { ErrorState, formatValue, PageError, useUrlState } from "./business_shared";

type Group = { jenis_sdm: string; status_aktif: string; total: number } | { module: string; tahun: number; total: number; participations: number } | { id_smt: string; simpulan: string; total: number };
type Row = { id_sdm: string; nama_sdm: string | null; nidn: string | null; nip?: string | null; jenis_sdm?: string; status_aktif?: string; id?: string; id_smt?: string; simpulan?: string | null; tahun?: number };
type ReportData = { groups: Group[]; rows: Row[]; total: number; page: number; per_page: number; source: { scope_count: number; failed_scope_count: number; oldest_fetch_at: string | null } };
type ReportKind = "sdm" | "bkd" | "luaran";
const kinds = [{ value: "sdm", label: "SDM" }, { value: "bkd", label: "BKD" }, { value: "luaran", label: "Luaran" }];
const labelModule = (key: string) => ({ publikasi: "Publikasi", penelitian: "Penelitian", pengabdian: "Pengabdian" }[key] ?? key);
const semesterLabel = (id: string) => /^\d{5}$/.test(id) ? Number(id.slice(0, 4)) + "/" + String(Number(id.slice(0, 4)) + 1).slice(-2) + " " + ({ "1": "Ganjil", "2": "Genap", "3": "Pendek" }[id.slice(-1)] ?? "") : id;

export function BusinessReportPage() {
  const trpc = useTRPC();

  const state = useUrlState();
  const kind: ReportKind = ["sdm", "bkd", "luaran"].includes(state.values.jenis ?? "") ? state.values.jenis as ReportKind : "sdm";
  const page = Math.max(1, Number(state.values.page) || 1);
  const query = useQuery({ ...trpc.business.report.queryOptions({
    kind, jenis_sdm: state.values.jenis_sdm, status_aktif: state.values.status_aktif,
    module: state.values.module as "publikasi" | "penelitian" | "pengabdian" | undefined,
    tahun: state.values.tahun ? Number(state.values.tahun) : undefined,
    id_smt: state.values.id_smt, simpulan: state.values.simpulan, page, per_page: 50,
  }), enabled: state.ready });
  const data = query.data as unknown as ReportData | undefined;
  return <PageShell activeLabel="Laporan" breadcrumb={[{ href: "/", label: "Ikhtisar" }, { label: "Laporan" }]}>
    <Tabs ariaLabel="Jenis laporan" items={kinds} onValueChange={(value) => state.set({ jenis: value, jenis_sdm: null, status_aktif: null, module: null, tahun: null, id_smt: null, simpulan: null, page: null })} value={kind}>
      <div className="space-y-5 pt-4">
        <p className="text-xs text-[hsl(var(--color-muted))]">Angka dihitung dari scope replika PT. Scope yang gagal ditampilkan sebagai keterbatasan sumber, bukan angka nol.</p>
        {query.error && <ErrorState message={query.error.message} title="Laporan belum dapat dimuat" />}
        {query.isPending && <PageError error={null} pending title="Laporan" />}
        {data && <p className="text-xs text-[hsl(var(--color-muted))]">Sumber: {data.source.scope_count.toLocaleString("id-ID")} scope; {data.source.failed_scope_count.toLocaleString("id-ID")} gagal{data.source.oldest_fetch_at ? " · data tertua " + new Date(data.source.oldest_fetch_at).toLocaleString("id-ID") : ""}.</p>}

        {data && kind === "sdm" && <SdmReport data={data} state={state} page={page} />}
        {data && kind === "luaran" && <OutputReport data={data} state={state} page={page} />}
        {data && kind === "bkd" && <BkdReport data={data} state={state} page={page} />}
      </div>
    </Tabs>
  </PageShell>;
}

function SdmReport({ data, state, page }: { data: ReportData; state: ReturnType<typeof useUrlState>; page: number }) {
  const groups = data.groups as Extract<Group, { jenis_sdm: string }>[];
  const statusTotals = new Map<string, number>();
  for (const row of groups) statusTotals.set(row.status_aktif, (statusTotals.get(row.status_aktif) ?? 0) + row.total);
  const statuses = [...statusTotals].map(([label, total]) => ({ label, total }));
  const filtered = Boolean(state.values.jenis_sdm || state.values.status_aktif);
  return <div className="space-y-5">
    {statuses.length ? <ChartCard chart={<StatusBarChart rows={statuses} />} subtitle="Jumlah SDM menurut status aktif." table={{ columns: ["Status", "SDM"], rows: statuses.map((row) => [row.label, row.total]) }} title="Komposisi status SDM" footer="Setiap kelompok pada tabel membuka daftar SDM dengan filter yang sama." /> : <State title="Data SDM belum tersedia" tone="unavailable" />}
    <DataTable caption="Komposisi SDM" columns={[
      { key: "status", header: "Status aktif", render: (row) => row.status_aktif },
      { key: "kind", header: "Jenis SDM", render: (row) => row.jenis_sdm },
      { key: "total", header: "Jumlah", render: (row) => row.total.toLocaleString("id-ID") },

      { key: "open", header: "", render: (row) => <Link className="font-semibold text-[hsl(var(--color-primary))]" href={"/laporan?jenis=sdm&status_aktif=" + encodeURIComponent(row.status_aktif) + "&jenis_sdm=" + encodeURIComponent(row.jenis_sdm)}>Buka daftar</Link> },
    ] as DataTableColumn<Extract<Group, { jenis_sdm: string }>>[]} empty="Belum ada komposisi SDM." getRowKey={(row) => row.status_aktif + row.jenis_sdm} rows={groups} />
    {filtered && <section className="space-y-3 border-t border-[hsl(var(--color-border))] pt-4">
      <h2 className="text-sm font-bold">Daftar SDM sesuai filter</h2>
      <DataTable caption="SDM sesuai filter" columns={[
        { key: "name", header: "Nama SDM", render: (row) => <Link className="font-semibold text-[hsl(var(--color-primary))]" href={"/pegawai/" + encodeURIComponent(row.id_sdm)}>{formatValue(row.nama_sdm)}</Link> },
        { key: "nidn", header: "NIDN", render: (row) => formatValue(row.nidn) },
        { key: "nip", header: "NIP", render: (row) => formatValue(row.nip) },
        { key: "kind", header: "Jenis", render: (row) => row.jenis_sdm },
        { key: "status", header: "Status aktif", render: (row) => row.status_aktif },
      ] as DataTableColumn<Row>[]} empty="Tidak ada SDM pada filter ini." getRowKey={(row) => row.id_sdm} rows={data.rows} pagination={<ReportPagination page={page} total={data.total} perPage={data.per_page} onPage={(value) => state.set({ page: String(value) })} />} />
    </section>}
  </div>;
}

function OutputReport({ data, state, page }: { data: ReportData; state: ReturnType<typeof useUrlState>; page: number }) {
  const groups = data.groups as Extract<Group, { module: string }>[];
  const years = [...new Set(groups.map((row) => row.tahun))].sort((a, b) => a - b);

  const series = ["publikasi", "penelitian", "pengabdian"].map((module) => ({ label: labelModule(module), data: years.map((year) => groups.find((row) => row.module === module && row.tahun === year)?.total ?? 0) })).filter((row) => row.data.some(Boolean));
  const filtered = Boolean(state.values.module && state.values.tahun);
  return <div className="space-y-5">
    {years.length ? <ChartCard chart={<LuaranTrendChart years={years} series={series} currentYear={new Date().getFullYear()} />} subtitle="Jumlah record unik per tahun, sesuai field tanggal/tahun pada SISTER." table={{ columns: ["Tahun", ...series.map((row) => row.label)], rows: years.map((year, index) => [String(year), ...series.map((row) => row.data[index])]) }} title="Tren luaran tridharma" footer="Pilih modul dan tahun pada tabel untuk membuka record sumber." /> : <State title="Data luaran belum tersedia" tone="unavailable" />}
    <DataTable caption="Luaran per tahun" columns={[
      { key: "module", header: "Modul", render: (row) => labelModule(row.module) },
      { key: "year", header: "Tahun", render: (row) => row.tahun },
      { key: "total", header: "Record unik", render: (row) => row.total.toLocaleString("id-ID") },
      { key: "participations", header: "Partisipasi SDM", render: (row) => row.participations.toLocaleString("id-ID") },
      { key: "open", header: "", render: (row) => <Link className="font-semibold text-[hsl(var(--color-primary))]" href={"/laporan?jenis=luaran&module=" + row.module + "&tahun=" + row.tahun}>Buka daftar</Link> },
    ] as DataTableColumn<Extract<Group, { module: string }>>[]} empty="Belum ada data luaran dengan tahun tercatat." getRowKey={(row) => row.module + row.tahun} rows={groups} />
    {filtered && <DataTable caption="Record luaran" columns={[
      { key: "sdm", header: "ID SDM", render: (row) => formatValue(row.id_sdm) },

      { key: "year", header: "Tahun", render: (row) => row.tahun },
      { key: "open", header: "", render: (row) => row.id && row.id_sdm ? <Link className="font-semibold text-[hsl(var(--color-primary))]" href={"/" + state.values.module + "/" + encodeURIComponent(row.id) + "?id_sdm=" + encodeURIComponent(row.id_sdm)}>Lihat record</Link> : "Detail tidak tersedia" },
    ] as DataTableColumn<Row>[]} empty="Tidak ada record pada filter ini." getRowKey={(row) => row.id_sdm + row.id} rows={data.rows} pagination={<ReportPagination page={page} total={data.total} perPage={data.per_page} onPage={(value) => state.set({ page: String(value) })} />} />}
  </div>;
}

function BkdReport({ data, state, page }: { data: ReportData; state: ReturnType<typeof useUrlState>; page: number }) {
  const groups = data.groups as Extract<Group, { id_smt: string }>[];
  const semesters = [...new Set(groups.map((row) => row.id_smt))].sort();
  const chart = semesters.map((id) => ({ label: semesterLabel(id), memenuhi: groups.filter((row) => row.id_smt === id && row.simpulan === "M").reduce((sum, row) => sum + row.total, 0), tidak_memenuhi: groups.filter((row) => row.id_smt === id && row.simpulan === "T").reduce((sum, row) => sum + row.total, 0) }));
  const filtered = Boolean(state.values.id_smt);
  return <div className="space-y-5">
    {chart.length ? <ChartCard chart={<BkdSemesterChart semesters={chart} />} subtitle="Simpulan yang dicatat asesor SISTER; tidak ada ambang lokal." table={{ columns: ["Semester", "Memenuhi", "Tidak memenuhi"], rows: chart.map((row) => [row.label, row.memenuhi, row.tidak_memenuhi]) }} title="Simpulan BKD per semester" footer="Tabel berikut membuka daftar berdasarkan semester dan simpulan." /> : <State title="Data BKD belum tersedia" tone="unavailable" />}

    <DataTable caption="Simpulan BKD" columns={[
      { key: "semester", header: "Semester", render: (row) => semesterLabel(row.id_smt) },
      { key: "conclusion", header: "Simpulan", render: (row) => row.simpulan },
      { key: "total", header: "Jumlah SDM", render: (row) => row.total.toLocaleString("id-ID") },
      { key: "open", header: "", render: (row) => <Link className="font-semibold text-[hsl(var(--color-primary))]" href={"/laporan?jenis=bkd&id_smt=" + encodeURIComponent(row.id_smt) + "&simpulan=" + encodeURIComponent(row.simpulan)}>Buka daftar</Link> },
    ] as DataTableColumn<Extract<Group, { id_smt: string }>>[]} empty="Belum ada simpulan BKD." getRowKey={(row) => row.id_smt + row.simpulan} rows={groups} />
    {filtered && <DataTable caption="Laporan akhir BKD per SDM" columns={[
      { key: "name", header: "Nama SDM", render: (row) => formatValue(row.nama_sdm) },
      { key: "nidn", header: "NIDN", render: (row) => formatValue(row.nidn) },
      { key: "conclusion", header: "Simpulan", render: (row) => row.simpulan ?? "Tidak tersedia" },
      { key: "open", header: "", render: (row) => row.id_smt ? <Link className="font-semibold text-[hsl(var(--color-primary))]" href={"/bkd?id_sdm=" + encodeURIComponent(row.id_sdm) + "&id_smt=" + encodeURIComponent(row.id_smt) + "&tab=laporan_akhir_bkd"}>Lihat laporan</Link> : "Semester tidak tersedia" },
    ] as DataTableColumn<Row>[]} empty="Tidak ada laporan pada filter ini." getRowKey={(row) => row.id_sdm + (row.id_smt ?? "")} rows={data.rows} pagination={<ReportPagination page={page} total={data.total} perPage={data.per_page} onPage={(value) => state.set({ page: String(value) })} />} />}
  </div>;
}
function ReportPagination({ page, perPage, total, onPage }: { page: number; perPage: number; total: number; onPage: (page: number) => void }) {

  return <div className="flex items-center justify-between"><span className="text-xs text-[hsl(var(--color-muted))]">{total.toLocaleString("id-ID")} data</span><Pagination page={page} pageCount={Math.max(1, Math.ceil(total / perPage))} onPageChange={onPage} /></div>;
}

