"use client";

import { useQuery } from "@tanstack/react-query";

import { PageShell } from "@/component/ui/page_shell";
import { State } from "@/component/ui/state";
import { Button } from "@/component/ui/button";
import { Select } from "@/component/ui/select";
import { Pagination } from "@/component/ui/pagination";
import { useUrlState } from "@/hook/use-url-state";
import { parsePageParam } from "@/lib/pagination";
import { DataTable } from "@/component/widget/data_table";
import { useTRPC } from "@/lib/trpc";
import { cn } from "@/lib/cn";

const statusTone: Record<string, string> = {
  SUCCEEDED: "bg-[hsl(var(--color-primary-soft))] text-[hsl(var(--color-primary-strong))]",
  PARTIAL: "bg-[hsl(var(--color-warning-soft))] text-[hsl(var(--color-text))]",
  FAILED: "bg-[hsl(var(--color-danger-soft))] text-[hsl(var(--color-danger-strong))]",
  RUNNING: "bg-[hsl(var(--color-canvas))] text-[hsl(var(--color-muted))]",
};

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("id-ID") : "-";
}

function duration(start: string, end: string | null) {
  const seconds = Math.round(((end ? new Date(end) : new Date()).getTime() - new Date(start).getTime()) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const text =
    hours > 0 ? `${hours} jam ${minutes} mnt` : minutes > 0 ? `${minutes} mnt ${seconds % 60} dtk` : `${seconds} dtk`;
  return end ? text : `${text} (berjalan)`;
}

export function ReplikaStatusPage() {
  const trpc = useTRPC();
  const state = useUrlState();
  const runPage = parsePageParam(state.values.page_run);
  const scopePage = parsePageParam(state.values.page_scope);
  const requestedSize = Number(state.values.per_page);
  const perPage = [10, 20, 50, 100].includes(requestedSize) ? requestedSize : 20;
  const statusQuery = useQuery({
    ...trpc.replika.sync_status.queryOptions({ run_page: runPage, scope_page: scopePage, per_page: perPage }),
    enabled: state.ready,
  });
  const data = statusQuery.data;

  return (
    <PageShell
      activeLabel="Status Sinkronisasi"
      actions={<><Select ariaLabel="Baris status per halaman" value={String(perPage)} options={[10, 20, 50, 100].map(value => ({ value: String(value), label: `${value} baris` }))} onValueChange={value => state.set({ per_page: value, page_run: "1", page_scope: "1" })} /><Button disabled={statusQuery.isFetching} onClick={() => statusQuery.refetch()} size="sm" variant="secondary">Perbarui</Button></>}
      breadcrumb={[{ href: "/", label: "Ikhtisar" }, { label: "Status Sinkronisasi" }]}
    >
      <div className="space-y-2">
        <h1 className="sr-only">Status sinkronisasi replika</h1>
        <p className="text-sm text-[hsl(var(--color-muted))]">
          Riwayat <code>bun run sister:sync</code>. Status PARTIAL berarti belum semua scope berhasil;
          periksa rincian sumber sebelum menganggap data lengkap.
        </p>
      </div>

      {statusQuery.isPending && <State title="Memuat status..." tone="loading" />}
      {statusQuery.isError && (
        <State description={statusQuery.error.message} title="Status belum dapat dimuat" tone={statusQuery.error.data?.code === "FORBIDDEN" || statusQuery.error.data?.code === "UNAUTHORIZED" ? "forbidden" : "error"} />
      )}

      {data && (
        <>
          <DataTable
            caption="Riwayat sinkronisasi"
            columns={[
              {
                key: "status",
                header: "Status",
                render: (run) => (
                  <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", statusTone[run.status])}>
                    {run.status}
                  </span>
                ),
              },
              { key: "target", header: "Target", render: (run) => run.target },
              { key: "scope", header: "Scope", render: (run) => run.scope },
              { key: "started", header: "Mulai", render: (run) => formatDateTime(run.started_at) },
              {
                key: "heartbeat",
                header: "Heartbeat",
                render: (run) => (run.status === "RUNNING" ? formatDateTime(run.heartbeat_at) : "-"),
              },
              { key: "duration", header: "Durasi", render: (run) => duration(run.started_at, run.finished_at) },
              { key: "requests", header: "Request", render: (run) => run.request_count.toLocaleString("id-ID") },
              { key: "records", header: "Record", render: (run) => run.record_count.toLocaleString("id-ID") },
              { key: "changed", header: "Baru/berubah", render: (run) => run.changed_count.toLocaleString("id-ID") },
              { key: "deleted", header: "Dihapus", render: (run) => run.deleted_count.toLocaleString("id-ID") },
              { key: "errors", header: "Error", render: (run) => run.error_count.toLocaleString("id-ID") },
            ]}
            empty="Belum pernah ada sinkronisasi."
            getRowKey={(run) => run.id}
            rows={data.runs}
            pagination={<div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-[hsl(var(--color-muted))]">{data.run_total.toLocaleString("id-ID")} run</span><Pagination ariaLabel="Halaman riwayat sinkronisasi" page={runPage} pageCount={Math.ceil(data.run_total / data.per_page)} onPageChange={next => state.set({ page_run: String(next) })} disabled={statusQuery.isFetching} /></div>}
          />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[hsl(var(--color-text))]">Status scope selain HTTP 200</h2>
            <DataTable
              caption="Ringkasan status scope"
              columns={[
                { key: "endpoint", header: "Endpoint", render: (row) => <code className="text-xs">{row.endpoint}</code> },
                { key: "status", header: "HTTP", render: (row) => row.status || "jaringan" },
                { key: "code", header: "Kode", render: (row) => row.code ?? "-" },
                { key: "scopes", header: "Jumlah scope", render: (row) => row.scopes },
                { key: "last", header: "Terakhir", render: (row) => formatDateTime(row.last_fetched_at) },
              ]}
              empty="Tidak ada scope dengan status selain HTTP 200."
              getRowKey={(row) => `${row.endpoint}-${row.status}-${row.code}`}
              rows={data.failing_scopes}
              pagination={<div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-[hsl(var(--color-muted))]">{data.scope_group_total.toLocaleString("id-ID")} kelompok endpoint/status</span><Pagination ariaLabel="Halaman kelompok status scope" page={scopePage} pageCount={Math.ceil(data.scope_group_total / data.per_page)} onPageChange={next => state.set({ page_scope: String(next) })} disabled={statusQuery.isFetching} /></div>}
            />
          </section>
        </>
      )}
    </PageShell>
  );
}
