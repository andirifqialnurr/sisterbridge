import { BriefcaseBusiness, FileText } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/component/widget";

import type { RiwayatPekerjaanDetailResponse } from "../api/riwayat_pekerjaan_schemas";

type RiwayatPekerjaanDocument = RiwayatPekerjaanDetailResponse["item"]["dokumen"][number];

type RiwayatPekerjaanDetailWidgetProps = {
  item: RiwayatPekerjaanDetailResponse["item"];
};

const documentColumns: DataTableColumn<RiwayatPekerjaanDocument>[] = [
  { key: "nama", header: "Nama", render: (document) => document.nama },
  { key: "jenis", header: "Jenis", render: (document) => document.jenis_dokumen },
  {
    key: "file",
    header: "File",
    render: (document) => document.nama_file || document.tautan || "-",
  },
  { key: "upload", header: "Upload", render: (document) => document.tanggal_upload || "-" },
  { key: "keterangan", header: "Keterangan", render: (document) => document.keterangan || "-" },
];

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null;
}) {
  const displayValue =
    typeof value === "boolean" ? (value ? "Ya" : "Tidak") : (value ?? "") || "-";

  return (
    <div className="border-b border-[hsl(var(--color-border))] py-3 last:border-b-0">
      <dt className="text-xs text-[hsl(var(--color-muted))]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[hsl(var(--color-text))]">
        {displayValue}
      </dd>
    </div>
  );
}

export function RiwayatPekerjaanDetailWidget({ item }: RiwayatPekerjaanDetailWidgetProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-[hsl(var(--color-border))] bg-white p-6 shadow-[0_1px_2px_hsl(145_20%_20%/0.04)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--color-primary-soft))] text-[hsl(var(--color-primary))]">
            <BriefcaseBusiness aria-hidden size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--color-primary))]">
              Riwayat Pekerjaan
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[hsl(var(--color-text))]">
              {item.nama_jabatan}
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--color-muted))]">{item.instansi}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[hsl(var(--color-border))] bg-white p-5 shadow-[0_1px_2px_hsl(145_20%_20%/0.04)]">
          <h2 className="text-sm font-bold text-[hsl(var(--color-text))]">Data pekerjaan</h2>
          <dl className="mt-4">
            <DetailField label="Jenis pekerjaan" value={item.jenis_pekerjaan} />
            <DetailField label="Jabatan" value={item.nama_jabatan} />
            <DetailField label="Instansi" value={item.instansi} />
            <DetailField label="Divisi" value={item.divisi} />
            <DetailField label="Bidang usaha" value={item.bidang_usaha} />
            <DetailField label="Luar negeri" value={item.luar_negeri} />
          </dl>
        </section>

        <section className="rounded-xl border border-[hsl(var(--color-border))] bg-white p-5 shadow-[0_1px_2px_hsl(145_20%_20%/0.04)]">
          <h2 className="text-sm font-bold text-[hsl(var(--color-text))]">Detail SISTER</h2>
          <dl className="mt-4">
            <DetailField label="ID SDM" value={item.id_sdm} />
            <DetailField label="ID bidang usaha" value={item.id_bidang_usaha} />
            <DetailField label="ID jenis pekerjaan" value={item.id_jenis_pekerjaan} />
            <DetailField label="Mulai bekerja" value={item.mulai_bekerja} />
            <DetailField label="Selesai bekerja" value={item.selesai_bekerja} />
            <DetailField label="Deskripsi kerja" value={item.deskripsi_kerja} />
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-[hsl(var(--color-border))] bg-white p-5 shadow-[0_1px_2px_hsl(145_20%_20%/0.04)]">
        <div className="flex items-center gap-2">
          <FileText aria-hidden className="text-[hsl(var(--color-primary))]" size={17} />
          <h2 className="text-sm font-bold text-[hsl(var(--color-text))]">Metadata dokumen</h2>
        </div>
        <div className="mt-4">
          <DataTable
            caption="Metadata dokumen riwayat pekerjaan"
            columns={documentColumns}
            empty="Tidak ada metadata dokumen pada detail ini."
            getRowKey={(document) => document.id}
            rows={item.dokumen}
            tableClassName="min-w-[760px]"
          />
        </div>
      </section>
    </section>
  );
}
