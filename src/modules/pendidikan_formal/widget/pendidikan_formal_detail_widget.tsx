import { DataTable, type DataTableColumn } from "@/component/widget";

import type { PendidikanFormalDetailResponse } from "../api/pendidikan_formal_schemas";

type PendidikanFormalDocument = PendidikanFormalDetailResponse["item"]["dokumen"][number];

type PendidikanFormalDetailWidgetProps = {
  item: PendidikanFormalDetailResponse["item"];
};

const documentColumns: DataTableColumn<PendidikanFormalDocument>[] = [
  {
    key: "nama",
    header: "Nama",
    render: (document) => (
      <>
        <p className="font-semibold text-[hsl(var(--color-text))]">{document.nama}</p>
        <p className="mt-1 font-mono text-xs text-[hsl(var(--color-muted))]">{document.id}</p>
      </>
    ),
  },
  {
    key: "jenis",
    header: "Jenis / file",
    render: (document) => (
      <>
        <p>{document.jenis_dokumen}</p>
        <p className="mt-1">
          {document.nama_file} · {document.jenis_file}
        </p>
      </>
    ),
    className: "text-xs text-[hsl(var(--color-muted))]",
  },
  {
    key: "upload",
    header: "Tanggal upload",
    render: (document) => document.tanggal_upload,
    className: "text-xs text-[hsl(var(--color-muted))]",
  },
  {
    key: "tautan",
    header: "Tautan",
    render: (document) => document.tautan || "Tidak tersedia",
    className: "max-w-[220px] break-words text-xs text-[hsl(var(--color-muted))]",
  },
  {
    key: "keterangan",
    header: "Keterangan",
    render: (document) => document.keterangan || "Tidak tersedia",
    className: "max-w-[220px] break-words text-xs text-[hsl(var(--color-muted))]",
  },
];

export function PendidikanFormalDetailWidget({ item }: PendidikanFormalDetailWidgetProps) {
  return (
    <div className="space-y-6">
      <article className="rounded-xl border border-[hsl(var(--color-border))] bg-white p-5 shadow-[0_1px_2px_hsl(145_20%_20%/0.04)] sm:p-6">
        <div className="flex flex-col justify-between gap-3 border-b border-[hsl(var(--color-border))] pb-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-bold text-[hsl(var(--color-text))]">
              Detail pendidikan formal
            </p>
            <p className="mt-1 font-mono text-xs text-[hsl(var(--color-muted))]">{item.id}</p>
          </div>
          <span className="rounded-lg bg-[hsl(var(--color-primary-soft))] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--color-primary-strong))]">
            {item.jenis_ajuan || "Jenis ajuan tidak tersedia"}
          </span>
        </div>

        <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Jenjang pendidikan" value={item.jenjang_pendidikan} />
          <DetailField label="Gelar akademik" value={item.gelar_akademik} />
          <DetailField label="Bidang studi" value={item.bidang_studi} />
          <DetailField label="Nama perguruan tinggi" value={item.nama_perguruan_tinggi} />
          <DetailField label="Kategori kegiatan" value={item.kategori_kegiatan} />
          <DetailField label="ID SDM" value={item.id_sdm} />
          <DetailField label="ID program studi" value={item.id_program_studi} />
          <DetailField label="Nama program studi" value={item.nama_program_studi} />
          <DetailField label="ID jenjang pendidikan" value={item.id_jenjang_pendidikan} />
          <DetailField label="ID gelar akademik" value={item.id_gelar_akademik} />
          <DetailField label="ID bidang studi" value={item.id_bidang_studi} />
          <DetailField label="Tahun masuk" value={item.tahun_masuk} />
          <DetailField label="Tahun lulus" value={item.tahun_lulus} />
          <DetailField label="Tanggal lulus" value={item.tanggal_lulus} />
          <DetailField label="Nomor induk" value={item.nomor_induk} />
          <DetailField label="Jumlah semester" value={item.jumlah_semester} />
          <DetailField label="Jumlah SKS" value={item.jumlah_sks} />
          <DetailField label="IPK" value={item.ipk} />
          <DetailField label="SK penyetaraan" value={item.sk_penyetaraan} />
          <DetailField label="Tanggal SK penyetaraan" value={item.tanggal_sk_penyetaraan} />
          <DetailField label="Nomor ijazah" value={item.nomor_ijazah} />
          <DetailField label="Judul tugas akhir" value={item.judul_tugas_akhir} />
        </dl>
      </article>

      <article className="rounded-xl border border-[hsl(var(--color-border))] bg-white shadow-[0_1px_2px_hsl(145_20%_20%/0.04)]">
        <div className="border-b border-[hsl(var(--color-border))] p-5">
          <h2 className="text-sm font-bold text-[hsl(var(--color-text))]">Dokumen</h2>
          <p className="mt-1 text-xs text-[hsl(var(--color-muted))]">
            Metadata dokumen yang dikembalikan bersama detail pendidikan formal.
          </p>
        </div>
        <div className="p-5">
          <DataTable
            caption="Dokumen pendidikan formal"
            columns={documentColumns}
            empty="Tidak ada dokumen pada response SISTER."
            getRowKey={(document) => document.id}
            rows={item.dokumen}
            tableClassName="min-w-[900px]"
          />
        </div>
      </article>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: number | string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--color-muted))]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-[hsl(var(--color-text))]">
        {value === "" || value === null ? "Tidak tersedia" : String(value)}
      </dd>
    </div>
  );
}
