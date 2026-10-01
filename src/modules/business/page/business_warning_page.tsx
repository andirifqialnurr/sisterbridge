"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/component/ui/page_shell";
import { StatusBadge } from "@/component/ui/status_badge";
import { Tabs } from "@/component/ui/tabs";
import { DataTable, type DataTableColumn } from "@/component/widget/data_table";
import { useTRPC } from "@/lib/trpc";
import { ErrorState, PageError, useUrlState } from "./business_shared";

type Endpoint = { endpoint: string; label: string; href: string; scope_count: number; failed_scope_count: number; not_found_scope_count: number; oldest_fetch_at: string | null; never_synced: boolean };
type Issue = { endpoint: string; scope_key: string; id_sdm: string | null; status: number; code: string | null; fetched_at: string; last_success_at: string | null; href: string };
type Run = { id: string; scope: string; status: string; request_count: number; error_count: number; started_at: string; finished_at: string | null };
type WarningData = { endpoints: Endpoint[]; issues_truncated: boolean; issues: Issue[]; bkd: { id_smt: string; simpulan: string; total: number }[]; runs: Run[] };
const tabs = [{ value: "data", label: "Sumber data" }, { value: "bkd", label: "Simpulan BKD" }];
const semesterLabel = (id: string) => /^\d{5}$/.test(id) ? Number(id.slice(0, 4)) + "/" + String(Number(id.slice(0, 4)) + 1).slice(-2) + " " + ({ "1": "Ganjil", "2": "Genap", "3": "Pendek" }[id.slice(-1)] ?? "") : id;

export function BusinessWarningPage() {
  const trpc = useTRPC();
  const state = useUrlState();
  const kind = state.values.jenis === "bkd" ? "bkd" : "data";
  const query = useQuery({ ...trpc.business.warnings.queryOptions(), enabled: state.ready });
  const data = query.data as WarningData | undefined;

  const endpointIssues = data?.endpoints.filter((row) => row.never_synced || row.failed_scope_count > 0) ?? [];
  const runIssues = data?.runs.filter((row) => row.status !== "SUCCEEDED") ?? [];
  return <PageShell activeLabel="Peringatan" breadcrumb={[{ href: "/", label: "Ikhtisar" }, { label: "Peringatan" }]}>
    <Tabs ariaLabel="Jenis peringatan" items={tabs} onValueChange={(value) => state.set({ jenis: value })} value={kind}>
      <div className="space-y-5 pt-4">
        {query.error && <ErrorState message={query.error.message} title="Peringatan belum dapat dimuat" />}
        {query.isPending && <PageError error={null} pending title="Peringatan" />}
        {data && kind === "data" && <>
          <p className="text-xs text-[hsl(var(--color-muted))]">Ringkasan 135 endpoint JSON yang dapat direplikasi. Endpoint turunan bisa belum memiliki scope bila parent tidak ditemukan; umur data ditampilkan, ambang stale belum ditetapkan.</p>
          <section className="space-y-3">
            <h2 className="text-sm font-bold">Endpoint tanpa scope tercatat atau memiliki fetch bermasalah</h2>
            <DataTable caption="Status endpoint replika" columns={[
              { key: "endpoint", header: "Endpoint", render: (row) => <code className="text-xs">{row.endpoint}</code> },
              { key: "module", header: "Modul", render: (row) => row.label },
              { key: "status", header: "Kondisi", render: (row) => row.never_synced ? <StatusBadge>Tidak ada scope tercatat</StatusBadge> : <StatusBadge tone={row.failed_scope_count === row.not_found_scope_count ? "warning" : "danger"}>{row.failed_scope_count.toLocaleString("id-ID")} gagal · {row.not_found_scope_count.toLocaleString("id-ID")} HTTP 404</StatusBadge> },
              { key: "count", header: "Scope", render: (row) => row.scope_count.toLocaleString("id-ID") },
              { key: "age", header: "Scope tertua", render: (row) => row.oldest_fetch_at ? new Date(row.oldest_fetch_at).toLocaleString("id-ID") : "—" },

              { key: "open", header: "", render: (row) => <Link className="font-semibold text-[hsl(var(--color-primary))]" href={row.href}>Buka modul</Link> },
            ] as DataTableColumn<Endpoint>[]} empty="Semua endpoint sudah memiliki scope dan tidak ada fetch gagal yang tercatat." getRowKey={(row) => row.endpoint} rows={endpointIssues} />
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold">Scope dengan status selain 200</h2>{data.issues_truncated && <p className="text-xs text-[hsl(var(--color-muted))]">Menampilkan 200 scope terbaru; buka status sinkronisasi untuk pemeriksaan lengkap.</p>}
            <DataTable caption="Scope replika gagal" columns={[
              { key: "endpoint", header: "Endpoint", render: (row) => <code className="text-xs">{row.endpoint}</code> },
              { key: "scope", header: "Scope", render: (row) => <span className="break-all font-mono text-xs">{row.scope_key}</span> },
              { key: "status", header: "Status", render: (row) => <StatusBadge tone={row.status === 404 ? "warning" : "danger"}>{row.status === 404 ? "HTTP 404" : "HTTP " + row.status}</StatusBadge> },
              { key: "code", header: "Kode", render: (row) => row.code ?? "—" },
              { key: "time", header: "Diperiksa", render: (row) => new Date(row.fetched_at).toLocaleString("id-ID") },
              { key: "open", header: "", render: (row) => <Link className="font-semibold text-[hsl(var(--color-primary))]" href={row.href}>Lihat data</Link> },
            ] as DataTableColumn<Issue>[]} empty="Tidak ada scope gagal atau 404." getRowKey={(row) => row.endpoint + ":" + row.scope_key} rows={data.issues} />
          </section>
          <section className="space-y-3">

            <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold">Run sinkronisasi</h2><Link className="text-sm font-semibold text-[hsl(var(--color-primary))]" href="/replika/status">Riwayat lengkap</Link></div>
            <DataTable caption="Run gagal atau parsial" columns={[
              { key: "status", header: "Status", render: (row) => <StatusBadge tone={row.status === "PARTIAL" ? "warning" : "danger"}>{row.status}</StatusBadge> },
              { key: "scope", header: "Cakupan", render: (row) => row.scope },
              { key: "started", header: "Mulai", render: (row) => new Date(row.started_at).toLocaleString("id-ID") },
              { key: "errors", header: "Error", render: (row) => row.error_count.toLocaleString("id-ID") },
            ] as DataTableColumn<Run>[]} empty="Tidak ada run gagal atau parsial pada 20 run terakhir." getRowKey={(row) => row.id} rows={runIssues} />
          </section>
        </>}
        {data && kind === "bkd" && <>
          <p className="text-xs text-[hsl(var(--color-muted))]">Simpulan T adalah status “tidak memenuhi” yang dicatat SISTER. Tidak ada ambang kelulusan buatan aplikasi.</p>
          <DataTable caption="Simpulan BKD yang dinyatakan tidak memenuhi" columns={[
            { key: "semester", header: "Semester", render: (row) => semesterLabel(row.id_smt) },
            { key: "total", header: "Jumlah SDM", render: (row) => row.total.toLocaleString("id-ID") },
            { key: "open", header: "", render: (row) => <Link className="font-semibold text-[hsl(var(--color-primary))]" href={"/laporan?jenis=bkd&id_smt=" + encodeURIComponent(row.id_smt) + "&simpulan=T"}>Lihat bukti</Link> },

          ] as DataTableColumn<WarningData["bkd"][number]>[]} empty="Tidak ada simpulan T pada data BKD tersinkron." getRowKey={(row) => row.id_smt} rows={data.bkd} />
        </>}
      </div>
    </Tabs>
  </PageShell>;
}

