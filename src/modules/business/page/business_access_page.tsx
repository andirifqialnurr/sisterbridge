"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/component/ui/page_shell";
import { State } from "@/component/ui/state";
import { StatusBadge } from "@/component/ui/status_badge";
import { useTRPC } from "@/lib/trpc";

function Value({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 border-b border-[hsl(var(--color-border))] pb-3"><dt className="text-xs font-medium text-[hsl(var(--color-muted))]">{label}</dt><dd className="mt-1 break-words text-sm font-semibold">{value}</dd></div>;
}

export function BusinessAccessPage() {
  const trpc = useTRPC();
  const app = useQuery(trpc.overview.status.queryOptions());
  const integration = useQuery(trpc.overview.integration.queryOptions());
  const session = useQuery(trpc.overview.session.queryOptions());
  const sync = useQuery(trpc.replika.sync_status.queryOptions());
  const latest = sync.data?.runs[0];
  return <PageShell activeLabel="Akses" breadcrumb={[{ href: "/", label: "Ikhtisar" }, { label: "Akses" }]}>
    {(app.error || integration.error || session.error || sync.error) && <State description="Sebagian informasi akses atau integrasi tidak berhasil dibaca." title="Status belum lengkap" tone="error" />}
    {app.isPending && <State title="Memeriksa status aplikasi..." tone="loading" />}
    {app.data && <section className="space-y-4">
      <h2 className="text-sm font-bold">Aplikasi dan login lokal</h2>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <Value label="Sesi lokal" value={app.data.session_state === "present" ? "Aktif" : "Tidak ada"} />
        <Value label="Role aplikasi" value={session.data?.role ?? "Belum tersedia"} />
        <Value label="Login" value={app.data.auth_mode === "local_login" ? "Login lokal" : "Fixture development"} />
        <Value label="Environment" value={app.data.environment} />
        <Value label="Database lokal" value={app.data.database_state === "configured" ? "Terkonfigurasi" : "Belum dikonfigurasi"} />
      </dl>
      <Link className="text-sm font-semibold text-[hsl(var(--color-primary))] hover:underline" href="/login">Buka halaman login lokal</Link>
    </section>}
    <section className="space-y-4 border-t border-[hsl(var(--color-border))] pt-4">
      <h2 className="text-sm font-bold">Integrasi SISTER</h2>
      {app.data && <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <Value label="Mode" value={app.data.sister_mode === "fixture" ? "Fixture" : "Live"} />
        <Value label="Konfigurasi" value={app.data.sister_configuration === "ready" ? "Siap" : "Belum lengkap"} />
        <Value label="Integrasi dikonfigurasi" value={integration.data?.configured ? "Ya" : "Belum"} />
        <Value label="Terdaftar di replika" value={integration.data?.registered ? "Ya" : "Belum tersinkron"} />
        <Value label="Status integrasi" value={!integration.data?.registered ? "Belum tercatat" : integration.data.enabled ? "Aktif" : "Nonaktif"} />
        <Value label="Role SISTER terakhir" value={integration.data?.expected_role ?? "Belum tercatat"} />
        <Value label="Pemeriksaan terakhir" value={integration.data?.last_health_at ? new Date(integration.data.last_health_at).toLocaleString("id-ID") : "Belum tercatat"} />
      </dl>}
      <p className="text-xs text-[hsl(var(--color-muted))]">Status konfigurasi tidak menguji koneksi jaringan. Role SISTER tersimpan dari proses authorize saat sinkronisasi. Credential dan token tidak ditampilkan.</p>
    </section>
    <section className="space-y-4 border-t border-[hsl(var(--color-border))] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-bold">Sinkronisasi terakhir</h2><Link className="text-sm font-semibold text-[hsl(var(--color-primary))]" href="/replika/status">Riwayat lengkap</Link></div>
      {sync.isPending && <State title="Memuat riwayat sinkronisasi..." tone="loading" />}
      {latest ? <div className="space-y-4">
        <StatusBadge tone={latest.status === "SUCCEEDED" ? "success" : latest.status === "PARTIAL" ? "warning" : "danger"}>{latest.status}</StatusBadge>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Value label="Cakupan run" value={latest.scope} />
          <Value label="Mulai" value={new Date(latest.started_at).toLocaleString("id-ID")} />
          <Value label="Selesai" value={latest.finished_at ? new Date(latest.finished_at).toLocaleString("id-ID") : "Masih berjalan"} />
          <Value label="Request" value={latest.request_count.toLocaleString("id-ID")} />
          <Value label="Error" value={latest.error_count.toLocaleString("id-ID")} />
        </dl>
      </div> : !sync.isPending && <State description="Belum ada catatan sinkronisasi untuk integrasi ini." title="Belum pernah disinkronkan" tone="unavailable" />}
    </section>
    <div className="flex flex-wrap gap-5 border-t border-[hsl(var(--color-border))] pt-4">
      <Link className="text-sm font-semibold text-[hsl(var(--color-primary))]" href="/laporan">Laporan managerial</Link>
      <Link className="text-sm font-semibold text-[hsl(var(--color-primary))]" href="/peringatan">Pusat peringatan</Link>
    </div>
  </PageShell>;
}
