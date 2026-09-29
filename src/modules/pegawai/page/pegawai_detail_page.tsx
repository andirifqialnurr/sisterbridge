"use client";

import { useState } from "react";

import { BriefcaseBusiness, CircleAlert, UserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageShell } from "@/component/ui/page_shell";
import { State } from "@/component/ui/state";
import { StatusBadge } from "@/component/ui/status_badge";
import { Tabs, type TabItem } from "@/component/ui/tabs";
import { useTRPC } from "@/lib/trpc";
import { BkdSemesterPicker } from "@/modules/bkd/widget/bkd_semester_picker";
import { BkdWorkspaceWidget } from "@/modules/bkd/widget/bkd_workspace_widget";
import { PendidikanFormalWorkspaceWidget } from "@/modules/pendidikan_formal/widget/pendidikan_formal_workspace_widget";
import { PenugasanWorkspaceWidget } from "@/modules/penugasan/widget/penugasan_workspace_widget";
import { RiwayatPekerjaanWorkspaceWidget } from "@/modules/riwayat_pekerjaan/widget/riwayat_pekerjaan_workspace_widget";

type PegawaiDetailPageProps = {
  idSdm: string;
};

const sdmTabs: TabItem[] = [
  { value: "ringkasan", label: "Ringkasan" },
  { value: "penugasan", label: "Penugasan" },
  { value: "pendidikan_formal", label: "Pendidikan Formal" },
  { value: "riwayat_pekerjaan", label: "Riwayat Pekerjaan" },
  { value: "bkd", label: "BKD" },
];

type SdmTabValue = (typeof sdmTabs)[number]["value"];

function DetailField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="border-b border-[hsl(var(--color-border))] py-3 last:border-b-0">
      <dt className="text-xs text-[hsl(var(--color-muted))]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[hsl(var(--color-text))]">{value || "—"}</dd>
    </div>
  );
}

export function PegawaiDetailPage({ idSdm }: PegawaiDetailPageProps) {
  const trpc = useTRPC();
  const detailQuery = useQuery(trpc.pegawai.get_detail.queryOptions({ id_sdm: idSdm }));
  const [activeTab, setActiveTab] = useState<SdmTabValue>("ringkasan");
  const [bkdSemesterId, setBkdSemesterId] = useState("");

  return (
    <PageShell
      actions={<StatusBadge tone="neutral">Read-only</StatusBadge>}
      activeLabel="Pegawai"
      breadcrumb={[{ href: "/", label: "Ikhtisar" }, { href: "/pegawai", label: "Pegawai" }]}
      detailLabel={detailQuery.data?.summary.nama_sdm ?? "pegawai"}
      maxWidth="1100px"
    >
          {detailQuery.isPending && (
            <State description="Mohon tunggu sebentar." title="Memuat detail pegawai..." tone="loading" />
          )}

          {detailQuery.isError && (
            <State
              description="Pastikan ID berasal dari hasil pencarian dan session memiliki akses read-only."
              title="Detail pegawai tidak dapat dimuat"
              tone="error"
            />
          )}

          {detailQuery.data && (
            <>
              <section className="rounded-xl border border-[hsl(var(--color-border))] bg-white p-6 shadow-[0_1px_2px_hsl(145_20%_20%/0.04)]">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--color-primary-soft))] text-[hsl(var(--color-primary))]">
                      <UserRound aria-hidden size={25} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--color-primary))]">
                        Detail SDM
                      </p>
                      <h1 className="mt-1 text-2xl font-bold tracking-tight text-[hsl(var(--color-text))]">
                        {detailQuery.data.summary.nama_sdm}
                      </h1>
                      <p className="mt-1 font-mono text-xs text-[hsl(var(--color-muted))]">
                        {detailQuery.data.summary.id_sdm}
                      </p>
                    </div>
                  </div>
                  <StatusBadge tone="success">
                    {detailQuery.data.summary.nama_status_aktif ?? "Status tidak tersedia"}
                  </StatusBadge>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-[hsl(var(--color-muted))]">
                  <span className="rounded-full bg-[hsl(var(--color-canvas))] px-3 py-1.5">
                    {detailQuery.data.summary.jenis_sdm ?? "Jenis tidak tersedia"}
                  </span>
                  <span className="rounded-full bg-[hsl(var(--color-canvas))] px-3 py-1.5">
                    {detailQuery.data.summary.nama_status_pegawai ?? "Status pegawai tidak tersedia"}
                  </span>
                </div>
              </section>

              <Tabs
                ariaLabel="Konteks SDM"
                items={sdmTabs}
                onValueChange={(value) => setActiveTab(value as SdmTabValue)}
                value={activeTab}
              >
                <div className="pt-5">
                  {activeTab === "ringkasan" && (
                    <div className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <section className="rounded-xl border border-[hsl(var(--color-border))] bg-white p-5 shadow-[0_1px_2px_hsl(145_20%_20%/0.04)]">
                          <div className="flex items-center gap-2">
                            <UserRound aria-hidden className="text-[hsl(var(--color-primary))]" size={17} />
                            <h2 className="text-sm font-bold text-[hsl(var(--color-text))]">Profil</h2>
                          </div>
                          <dl className="mt-4">
                            <DetailField label="Nama" value={detailQuery.data.profile.nama} />
                            <DetailField
                              label="Jenis kelamin"
                              value={detailQuery.data.profile.jenis_kelamin}
                            />
                            <DetailField label="Tempat lahir" value={detailQuery.data.profile.tempat_lahir} />
                            <DetailField
                              label="Tanggal lahir"
                              value={detailQuery.data.profile.tanggal_lahir}
                            />
                          </dl>
                        </section>

                        <section className="rounded-xl border border-[hsl(var(--color-border))] bg-white p-5 shadow-[0_1px_2px_hsl(145_20%_20%/0.04)]">
                          <div className="flex items-center gap-2">
                            <BriefcaseBusiness
                              aria-hidden
                              className="text-[hsl(var(--color-primary))]"
                              size={17}
                            />
                            <h2 className="text-sm font-bold text-[hsl(var(--color-text))]">Kepegawaian</h2>
                          </div>
                          <dl className="mt-4">
                            <DetailField label="NIP" value={detailQuery.data.employment.nip} />
                            <DetailField label="NIDN" value={detailQuery.data.employment.nidn} />
                            <DetailField label="NUPTK" value={detailQuery.data.employment.nuptk} />
                            <DetailField label="Sumber gaji" value={detailQuery.data.employment.sumber_gaji} />
                            <DetailField label="SK CPNS" value={detailQuery.data.employment.sk_cpns} />
                          </dl>
                        </section>
                      </div>

                      <div className="flex items-start gap-3 rounded-xl border border-[hsl(var(--color-primary))]/20 bg-[hsl(var(--color-primary-soft))] p-4 text-xs leading-5 text-[hsl(var(--color-primary-strong))]">
                        <CircleAlert aria-hidden className="mt-0.5 shrink-0" size={15} />
                        <p>
                          Data ini hanya contoh sintetis selama fixture mode. Pada mode
                          live, akses detail wajib melalui session dan permission server.
                        </p>
                      </div>
                    </div>
                  )}
                  {activeTab === "penugasan" && <PenugasanWorkspaceWidget sdmId={idSdm} />}
                  {activeTab === "pendidikan_formal" && (
                    <PendidikanFormalWorkspaceWidget sdmId={idSdm} />
                  )}
                  {activeTab === "riwayat_pekerjaan" && (
                    <RiwayatPekerjaanWorkspaceWidget sdmId={idSdm} />
                  )}
                  {activeTab === "bkd" && (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <BkdSemesterPicker
                          onChange={setBkdSemesterId}
                          sdmId={idSdm}
                          value={bkdSemesterId}
                        />
                      </div>
                      <BkdWorkspaceWidget semesterId={bkdSemesterId} sdmId={idSdm} />
                    </div>
                  )}
                </div>
              </Tabs>
            </>
          )}
    </PageShell>
  );
}
