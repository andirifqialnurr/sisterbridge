import { ReportChart } from "@/component/widget/report_chart";

import type { BkdLaporanAkhirResponse } from "../api/bkd_schemas";

type BkdSummaryWidgetProps = {
  items: BkdLaporanAkhirResponse["items"];
};

const sksCategories = ["Ajar", "Didik", "Lit", "Pengmas", "Penunjang"];

function toSksSeries(item: BkdLaporanAkhirResponse["items"][number]) {
  return [
    {
      name: "Kinerja",
      data: [
        item.sks_kinerja_ajar,
        item.sks_kinerja_didik,
        item.sks_kinerja_lit,
        item.sks_kinerja_pengmas,
        item.sks_kinerja_penunjang,
      ],
    },
    {
      name: "Lebih",
      data: [
        item.sks_lebih_ajar,
        item.sks_lebih_didik,
        item.sks_lebih_lit,
        item.sks_lebih_pengmas,
        item.sks_lebih_tunjang,
      ],
    },
  ];
}

export function BkdSummaryWidget({ items }: BkdSummaryWidgetProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map((item) => (
        <article
          className="rounded-xl border border-[hsl(var(--color-border))] bg-white p-5 shadow-[0_1px_2px_hsl(145_20%_20%/0.04)]"
          key={`${item.id_reg_ptk}-${item.id_smt}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[hsl(var(--color-text))]">
                Laporan akhir BKD
              </p>
              <p className="mt-1 font-mono text-xs text-[hsl(var(--color-muted))]">
                Semester {item.id_smt}
              </p>
            </div>
            <span className="rounded-lg bg-[hsl(var(--color-primary-soft))] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--color-primary-strong))]">
              {item.stat_tugas || "Status tidak tersedia"}
            </span>
          </div>

          <dl className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <SummaryField label="ID registrasi PTK" value={item.id_reg_ptk} />
            <SummaryField label="SKS kinerja" value={formatNumber(item.sks_kinerja)} />
            <SummaryField label="SKS lebih" value={formatNumber(item.sks_lebih)} />
            <SummaryField label="Kinerja ajar" value={formatNumber(item.sks_kinerja_ajar)} />
            <SummaryField label="Lebih ajar" value={formatNumber(item.sks_lebih_ajar)} />
            <SummaryField label="Kinerja didik" value={formatNumber(item.sks_kinerja_didik)} />
            <SummaryField label="Lebih didik" value={formatNumber(item.sks_lebih_didik)} />
            <SummaryField label="Kinerja lit" value={formatNumber(item.sks_kinerja_lit)} />
            <SummaryField label="Lebih lit" value={formatNumber(item.sks_lebih_lit)} />
            <SummaryField
              label="Kinerja pengmas"
              value={formatNumber(item.sks_kinerja_pengmas)}
            />
            <SummaryField label="Lebih pengmas" value={formatNumber(item.sks_lebih_pengmas)} />
            <SummaryField
              label="Kinerja penunjang"
              value={formatNumber(item.sks_kinerja_penunjang)}
            />
            <SummaryField
              label="Lebih tunjang"
              value={formatNumber(item.sks_lebih_tunjang)}
            />
            <SummaryField label="Status kewajiban" value={formatNumber(item.stat_kewajiban)} />
            <SummaryField label="Status belajar" value={item.stat_belajar} />
            <SummaryField label="ID jabfung" value={formatNumber(item.id_jabfung)} />
            <SummaryField label="Simpulan asesor" value={item.simpulan_asesor} />
          </dl>

          <div className="mt-5 border-t border-[hsl(var(--color-border))] pt-4">
            <p className="text-xs font-semibold text-[hsl(var(--color-text))]">
              SKS kinerja vs lebih per unsur
            </p>
            <ReportChart categories={sksCategories} series={toSksSeries(item)} type="bar" />
          </div>
        </article>
      ))}
    </div>
  );
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "-";
  }
  return value.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--color-muted))]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-[hsl(var(--color-text))]">
        {value || "Tidak tersedia"}
      </dd>
    </div>
  );
}
