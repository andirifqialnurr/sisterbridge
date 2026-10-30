"use client";

import { DataTable } from "@/component/widget/data_table";
import { Pagination } from "@/component/ui/pagination";
import { Select } from "@/component/ui/select";
import type { ReplicaCoverage } from "@/server/sister/replica/replica_coverage";

export const coverageLabels: Record<string, string> = {
  available: "Data tersedia",
  empty: "Kosong pada scope tersimpan",
  waiting_for_parent: "Menunggu data induk",
  never_fetched: "Belum diambil",
  not_found: "Tidak ditemukan (404)",
  partial_or_failed: "Sebagian gagal / terblokir",
};

export function coveragePage(data: ReplicaCoverage, filter: string, page: number, perPage: number) {
  const selected = Object.hasOwn(coverageLabels, filter) ? filter : "all";
  const filtered = data.endpoints.filter(row => selected === "all" || row.state === selected);
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(Math.max(1, page), pageCount);
  return { selected, total: filtered.length, page: current, pageCount, rows: filtered.slice((current - 1) * perPage, current * perPage) };
}

export function ReplicaCoverageTable({ data, filter, page, perPage, busy, onFilterChange, onPageChange }: {
  data: ReplicaCoverage;
  filter: string;
  page: number;
  perPage: number;
  busy: boolean;
  onFilterChange: (value: string) => void;
  onPageChange: (value: number) => void;
}) {
  const result = coveragePage(data, filter, page, perPage);
  return <section className="min-w-0 space-y-3" aria-labelledby="coverage-heading">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="coverage-heading" className="text-sm font-semibold">Coverage endpoint GET replika</h2>
      <Select ariaLabel="Filter coverage endpoint" value={result.selected} onValueChange={onFilterChange}
        options={[{ value: "all", label: "Semua status" }, ...Object.entries(coverageLabels).map(([value, label]) => ({ value, label }))]} />
    </div>
    <p className="text-sm text-[hsl(var(--color-muted))]">
      {data.summary.active_records.toLocaleString("id-ID")} record aktif; {data.summary.templates_with_records} dari {data.summary.templates} template memiliki data.
      {" "}Ini snapshot database lokal, bukan pengambilan live atau bukti seluruh record lengkap.
      {" "}{data.summary.live_only_gets} GET file/pencarian diperiksa terpisah dan tidak dihitung sukses di sini.
      {" "}Scope 403 bisa merupakan riwayat lintas PT; kosong tidak sama dengan gagal.
    </p>
    <DataTable caption="Coverage per endpoint GET replika" rows={result.rows} getRowKey={row => row.endpoint}
      empty="Tidak ada endpoint untuk filter ini. Pilih Semua status untuk kembali."
      columns={[
        { key: "endpoint", header: "Endpoint", render: row => <code className="text-xs">{row.endpoint}</code> },
        { key: "state", header: "Kondisi data", render: row => coverageLabels[row.state] ?? row.state },
        { key: "records", header: "Record aktif", render: row => row.records.toLocaleString("id-ID") },
        { key: "scopes", header: "Scope", render: row => row.scopes.toLocaleString("id-ID") },
        { key: "http", header: "HTTP : jumlah scope", render: row => Object.entries(row.statuses).map(([status, count]) => `${status === "0" ? "jaringan" : status}: ${count}`).join("; ") || "Belum ada" },
        { key: "last", header: "Scope terakhir diperiksa", render: row => row.last_checked_at ? new Date(row.last_checked_at).toLocaleString("id-ID") : "Belum ada" },
      ]}
      pagination={<div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-[hsl(var(--color-muted))]">{result.total} template endpoint</span>
        <Pagination ariaLabel="Halaman coverage endpoint" page={result.page} pageCount={result.pageCount} disabled={busy} onPageChange={onPageChange} />
      </div>} />
  </section>;
}
