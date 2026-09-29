"use client";

import { useQuery } from "@tanstack/react-query";

import { PageShell } from "@/component/ui/page_shell";
import { State } from "@/component/ui/state";
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
  const statusQuery = useQuery(trpc.replika.sync_status.queryOptions());
  const data = statusQuery.data;

  return (
    <PageShell
      activeLabel="Status Sinkronisasi"
      breadcrumb={[{ href: "/", label: "Ikhtisar" }, { label: "Status Sinkronisasi" }]}
    >
      <div className="space-y-2">
        <h1 className="text-lg font-bold text-[hsl(var(--color-text))]">Status sinkronisasi replika</h1>
        <p className="text-sm text-[hsl(var(--color-muted))]">
          Riwayat <code>bun run sister:sync</code>. Status PARTIAL wajar selama beberapa endpoint SISTER
          masih menjawab 500.
        </p>
      </div>

      {statusQuery.isPending && <State title="Memuat status..." tone="loading" />}
      {statusQuery.isError && (
        <State description={statusQuery.error.message} title="Status belum dapat dimuat" tone="forbidden" />
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
          />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[hsl(var(--color-text))]">Scope yang gagal pada pengambilan terakhir</h2>
            <DataTable
              caption="Scope gagal"
              columns={[
                { key: "endpoint", header: "Endpoint", render: (row) => <code className="text-xs">{row.endpoint}</code> },
                { key: "status", header: "HTTP", render: (row) => row.status || "jaringan" },
                { key: "code", header: "Kode", render: (row) => row.code ?? "-" },
                { key: "scopes", header: "Jumlah scope", render: (row) => row.scopes },
                { key: "last", header: "Terakhir", render: (row) => formatDateTime(row.last_fetched_at) },
              ]}
              empty="Tidak ada scope yang gagal."
              getRowKey={(row) => `${row.endpoint}-${row.status}-${row.code}`}
              rows={data.failing_scopes}
            />
          </section>
        </>
      )}
    </PageShell>
  );
}
