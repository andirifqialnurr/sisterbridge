"use client";

import Link from "next/link";
import { Database, DatabaseZap, GraduationCap, RefreshCw, UsersRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageShell } from "@/component/ui/page_shell";
import { State } from "@/component/ui/state";
import { ChartCard } from "@/component/widget/chart_card";
import { StatCard } from "@/component/widget/stat_card";
import { useTRPC } from "@/lib/trpc";

import { BkdSemesterChart, LuaranTrendChart, StatusBarChart } from "../widget/overview_charts";
import { OverviewStatusWidget } from "../widget/overview_status_widget";

const linkClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors";

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("id-ID") : "—";
}

export function OverviewPage() {
  const trpc = useTRPC();
  const dashboardQuery = useQuery(trpc.replika.dashboard.queryOptions());
  const dashboard = dashboardQuery.data;
  const loading = dashboardQuery.isPending;
  const coverage = dashboard?.coverage;
  const coverageComplete =
    coverage && coverage.total_sdm !== null && coverage.synced_sdm >= coverage.total_sdm;
  const luaran = dashboard?.luaran;

  return (
    <PageShell
      actions={
        <>
          <Link
            className={`${linkClassName} border border-[hsl(var(--color-border))] bg-white text-[hsl(var(--color-text))] hover:bg-[hsl(var(--color-primary-soft))]`}
            href="/replika/status"
          >
            <RefreshCw aria-hidden size={15} />
            Status sinkronisasi
          </Link>
          <Link
            className={`${linkClassName} bg-[hsl(var(--color-primary))] text-white hover:bg-[hsl(var(--color-primary-strong))]`}
            href="/replika"
          >
            <Database aria-hidden size={15} />
            Data replika
          </Link>
        </>
      }
      breadcrumb={[{ label: "Ikhtisar" }]}
    >
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              helper={
                dashboard?.sdm
                  ? `${formatNumber(dashboard.sdm.dosen)} dosen · ${formatNumber(dashboard.sdm.tendik)} tendik`
                  : "Dari replika /referensi/sdm"
              }
              icon={UsersRound}
              label="SDM"
              value={loading ? "…" : formatNumber(dashboard?.sdm?.total)}
            />
            <StatCard
              helper="Jenis Dosen dengan status Aktif"
              icon={GraduationCap}
              label="Dosen aktif"
              value={loading ? "…" : formatNumber(dashboard?.sdm?.dosen_aktif)}
            />
            <StatCard
              helper={
                coverage
                  ? coverageComplete
                    ? "Semua SDM sudah tersinkron"
                    : "SDM dengan data detail di replika; sisanya menunggu sinkronisasi"
                  : "Belum ada data sinkronisasi"
              }
              icon={Database}
              label="Cakupan replika"
              value={
                loading
                  ? "…"
                  : coverage
                    ? `${formatNumber(coverage.synced_sdm)} / ${formatNumber(coverage.total_sdm)}`
                    : "—"
              }
            />
            <StatCard
              helper={
                dashboard?.last_sync
                  ? `${dashboard.last_sync.status} · ${dashboard.last_sync.target}`
                  : "Jalankan bun run sister:sync"
              }
              icon={DatabaseZap}
              label="Sinkronisasi terakhir"
              value={
                loading
                  ? "…"
                  : dashboard?.last_sync?.finished_at
                    ? new Date(dashboard.last_sync.finished_at).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"
              }
            />
          </section>

          {dashboardQuery.isError && (
            <State
              description={dashboardQuery.error.message}
              title="Ringkasan replika belum dapat dimuat"
              tone="error"
            />
          )}

          {dashboard && coverage && !coverageComplete && (
            <p className="text-xs text-[hsl(var(--color-muted))]">
              Grafik luaran dan BKD dihitung dari {formatNumber(coverage.synced_sdm)} SDM yang sudah
              tersinkron, belum seluruh {formatNumber(coverage.total_sdm)} SDM.
            </p>
          )}

          {dashboard && (
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
              {luaran && luaran.series.length > 0 ? (
                <ChartCard
                  chart={
                    <LuaranTrendChart
                      currentYear={luaran.years.at(-1)}
                      series={luaran.series}
                      years={luaran.years}
                    />
                  }
                  subtitle={`Jumlah judul unik per tahun, ${luaran.years[0]}–${luaran.years.at(-1)} (* tahun berjalan, belum lengkap)`}
                  table={{
                    columns: ["Tahun", ...luaran.series.map((series) => series.label)],
                    rows: luaran.years.map((year, index) => [
                      String(year),
                      ...luaran.series.map((series) => series.data[index]),
                    ]),
                  }}
                  title="Luaran tridharma per tahun"
                />
              ) : (
                <State title="Data luaran belum tersedia di replika" />
              )}

              {dashboard.sdm ? (
                <ChartCard
                  chart={<StatusBarChart rows={dashboard.sdm.by_status} />}
                  subtitle="Jumlah SDM per status keaktifan"
                  table={{
                    columns: ["Status", "SDM"],
                    rows: dashboard.sdm.by_status.map((row) => [row.label, row.total]),
                  }}
                  title="Status keaktifan SDM"
                />
              ) : (
                <State title="Indeks SDM belum tersedia di replika" />
              )}
            </section>
          )}

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
            {dashboard?.bkd && dashboard.bkd.semesters.length > 0 ? (
              <ChartCard
                chart={<BkdSemesterChart semesters={dashboard.bkd.semesters} />}
                subtitle="Kesimpulan asesor pada laporan akhir BKD, jumlah dosen per semester"
                table={{
                  columns: ["Semester", "Memenuhi", "Tidak memenuhi"],
                  rows: dashboard.bkd.semesters.map((semester) => [
                    semester.label,
                    semester.memenuhi,
                    semester.tidak_memenuhi,
                  ]),
                }}
                title="Kesimpulan BKD per semester"
              />
            ) : (
              <State
                title={loading ? "Memuat ringkasan BKD..." : "Data BKD belum tersedia di replika"}
                tone={loading ? "loading" : "empty"}
              />
            )}

            <OverviewStatusWidget />
          </section>

          <section className="rounded-xl border border-[hsl(var(--color-primary))]/20 bg-[hsl(var(--color-primary-soft))] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[hsl(var(--color-primary))]">
                <ShieldIcon />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[hsl(var(--color-primary-strong))]">
                  Security boundary aktif sejak foundation
                </h2>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-[hsl(var(--color-primary-strong))]/75">
                  Browser hanya akan menerima session dan DTO yang sudah
                  dipilih. Credential SISTER, bearer token, dan payload
                  sensitif tetap berada di server.
                </p>
              </div>
            </div>
          </section>
    </PageShell>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m9.5 12 1.7 1.7 3.6-3.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
