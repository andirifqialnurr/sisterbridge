import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/component/widget";
import type { PendidikanFormalListResponse } from "../api/pendidikan_formal_schemas";

type PendidikanFormalItem = PendidikanFormalListResponse["items"][number];

type PendidikanFormalTableProps = {
  items: PendidikanFormalListResponse["items"];
};

export function PendidikanFormalTable({ items }: PendidikanFormalTableProps) {
  const columns: DataTableColumn<PendidikanFormalItem>[] = [
    {
      key: "degree",
      header: "Jenjang / gelar",
      render: (item) => (
        <>
          <p className="font-semibold text-[hsl(var(--color-text))]">
            {item.jenjang_pendidikan || "Tidak tersedia"}
          </p>
          <p className="mt-1 text-xs text-[hsl(var(--color-muted))]">
            {item.gelar_akademik || "Gelar akademik tidak tersedia"}
          </p>
        </>
      ),
    },
    {
      key: "field",
      header: "Bidang studi",
      render: (item) => item.bidang_studi || "Tidak tersedia",
    },
    {
      key: "institution",
      header: "Perguruan tinggi",
      render: (item) => (
        <span className="text-xs text-[hsl(var(--color-muted))]">
          {item.nama_perguruan_tinggi || "Tidak tersedia"}
        </span>
      ),
    },
    {
      key: "graduation-year",
      header: "Tahun lulus",
      render: (item) => item.tahun_lulus ?? "-",
    },
    {
      key: "submission-type",
      header: "ID jenis ajuan",
      render: (item) => (
        <span className="text-xs text-[hsl(var(--color-muted))]">{item.jenis_ajuan}</span>
      ),
    },
    {
      key: "action",
      header: "Aksi",
      className: "text-right",
      render: (item) => (
        <Link
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--color-primary))] transition-colors hover:text-[hsl(var(--color-primary-strong))]"
          href={`/pendidikan_formal/${item.id}`}
        >
          Lihat detail
          <ArrowUpRight aria-hidden size={14} />
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      caption="Daftar pendidikan formal SDM"
      columns={columns}
      getRowKey={(item) => item.id}
      rows={items}
      tableClassName="min-w-[980px]"
    />
  );
}
