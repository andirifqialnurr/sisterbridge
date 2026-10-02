"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/component/ui/page_shell";
import { Pagination } from "@/component/ui/pagination";
import { Select } from "@/component/ui/select";
import { State } from "@/component/ui/state";
import { Tabs } from "@/component/ui/tabs";
import { DataTable } from "@/component/widget/data_table";
import { getJelajahModule } from "@/modules/jelajah/api/jelajah_catalog";
import { useTRPC } from "@/lib/trpc";
import { emptyDescription, ErrorState, formatValue, labelFor, PageError, rowColumns, SdmPicker, SourceLine, useUrlState } from "./business_shared";

const tabs = [
  { value: "laporan_akhir_bkd", label: "Laporan akhir" },
  { value: "bkd_pendidikan", label: "Pendidikan" },
  { value: "bkd_ajar", label: "Pengajaran" },
  { value: "bkd_tunjang", label: "Penunjang" },
  { value: "bkd_pengmas", label: "Pengabdian" },
  { value: "bkd_penelitian", label: "Penelitian" },
];

export function BusinessBkdPage({ initialTab = "laporan_akhir_bkd" }: { initialTab?: string }) {
  const trpc = useTRPC();
  const state = useUrlState();
  const idSdm = state.values.id_sdm ?? "";
  const reportPage = Math.max(1, Number(state.values.page_laporan) || 1);
  const activityPage = Math.max(1, Number(state.values.page_aktivitas) || 1);
  const activeTab = tabs.some((tab) => tab.value === state.values.tab) ? state.values.tab : initialTab;
  const reports = useQuery({
    ...trpc.business.rows.queryOptions({ module: "laporan_akhir_bkd", id_sdm: idSdm || undefined, page: reportPage, per_page: 20, search: "" }),
    enabled: state.ready,
  });
  const semesters = useMemo(() => {
    const rows = reports.data?.rows ?? [];
    return [...new Set(rows.map((row) => String(row.values.id_smt ?? "")).filter(Boolean))].map((id) => {
      const row = rows.find((item) => String(item.values.id_smt ?? "") === id);
      return { value: id, label: String(row?.values.nama_semester ?? row?.values.tahun_semester ?? row?.values.semester ?? id) };
    });
  }, [reports.data]);
  const idSmt = state.values.id_smt || (idSdm ? semesters[0]?.value : "") || "";
  const semesterOptions = idSmt && !semesters.some((semester) => semester.value === idSmt)
    ? [{ value: idSmt, label: idSmt }, ...semesters]
    : semesters;
  const { ready, set: setUrlState } = state;
  const selectedSemester = state.values.id_smt;
  useEffect(() => {
    if (ready && idSdm && !selectedSemester && semesters[0]) setUrlState({ id_smt: semesters[0].value });
  }, [ready, idSdm, selectedSemester, semesters, setUrlState]);

  const currentModule = getJelajahModule(activeTab)!;
  const activity = useQuery({
    ...trpc.business.rows.queryOptions({ module: currentModule.key, id_sdm: idSdm || undefined, id_smt: idSmt || undefined, page: activityPage, per_page: 20, search: "" }),
    enabled: state.ready && (!idSdm || Boolean(idSmt)) && activeTab !== "laporan_akhir_bkd",
  });
  const current = activeTab === "laporan_akhir_bkd" ? reports : activity;
  const rows = current.data?.rows ?? [];
  const columns = current.data?.columns ?? [];
  const selectedReport = activeTab === "laporan_akhir_bkd"
    ? rows.find((row) => String(row.values.id_smt ?? "") === idSmt)
    : undefined;
  const reportSummary = selectedReport
    ? columns.filter((column) => /sks|simpulan/i.test(column.key)).slice(0, 8)
    : [];
  const activeLabel = getJelajahModule(activeTab)?.label ?? "BKD";
  return (
    <PageShell actions={<SdmPicker optional enabled={state.ready} onChange={(id) => state.set({ id_sdm: id || null, id_smt: null, page_laporan: "1", page_aktivitas: "1" })} value={idSdm} />} activeLabel={activeLabel} breadcrumb={[{ href: "/", label: "Ikhtisar" }, { label: "BKD" }]}>
      {<>
        {reports.error && <ErrorState message={reports.error.message} title="Laporan akhir BKD gagal dimuat" />}
        {reports.isPending && <PageError error={null} pending title="Laporan akhir BKD" />}
        {reports.data && <div className="flex flex-wrap items-center justify-between gap-3"><SourceLine source={reports.data.source} /><label className="w-full max-w-sm"><span className="mb-1 block text-xs font-semibold text-[hsl(var(--color-muted))]">Semester</span><Select ariaLabel="Pilih semester BKD" disabled={semesterOptions.length === 0} onValueChange={(value) => state.set({ id_smt: value, page_aktivitas: "1" })} options={idSdm ? semesterOptions : [{ value: "", label: "Semua semester" }, ...semesterOptions]} placeholder="Semester belum tersedia" value={idSmt} /></label></div>}
        <Tabs ariaLabel="Bagian laporan BKD" items={tabs.map((tab) => ({ ...tab, disabled: tab.value !== "laporan_akhir_bkd" && Boolean(idSdm) && !idSmt }))} onValueChange={(value) => state.set({ tab: value })} value={activeTab}>
          <div className="space-y-4 pt-4">
            {activeTab !== "laporan_akhir_bkd" && idSdm && !idSmt && <State description="Semester dipilih dari daftar laporan akhir SISTER yang tersimpan." title="Semester belum tersedia" tone="unavailable" />}
            {activeTab !== "laporan_akhir_bkd" && activity.error && <ErrorState message={activity.error.message} title={`${currentModule.label} gagal dimuat`} />}
            {activeTab !== "laporan_akhir_bkd" && activity.isPending && (!idSdm || idSmt) && <PageError error={null} pending title={currentModule.label} />}
            {activeTab !== "laporan_akhir_bkd" && activity.data && <SourceLine source={activity.data.source} />}
            {reportSummary.length > 0 && selectedReport && <dl className="grid grid-cols-2 gap-4 border-b border-[hsl(var(--color-border))] pb-4 md:grid-cols-4">{reportSummary.map((column) => <div key={column.key}><dt className="text-xs text-[hsl(var(--color-muted))]">{labelFor(column.key)}</dt><dd className="mt-1 text-lg font-semibold text-[hsl(var(--color-text))]">{formatValue(selectedReport.values[column.key])}</dd></div>)}</dl>}
            {current.data && <DataTable caption={currentModule.label} columns={rowColumns(currentModule.key, columns, idSdm)} empty={emptyDescription(current.data.source)} getRowKey={(row) => row.row_key ?? row.id} rows={rows} pagination={<div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-[hsl(var(--color-muted))]">{current.data.total.toLocaleString("id-ID")} data</span><Pagination page={activeTab === "laporan_akhir_bkd" ? reportPage : activityPage} pageCount={Math.max(1, Math.ceil(current.data.total / current.data.per_page))} onPageChange={(next) => state.set(activeTab === "laporan_akhir_bkd" ? { page_laporan: String(next), id_smt: null } : { page_aktivitas: String(next) })} /></div>} />}
          </div>
        </Tabs>
      </>}
    </PageShell>
  );
}
