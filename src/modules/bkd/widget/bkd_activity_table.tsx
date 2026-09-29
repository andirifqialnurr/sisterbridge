import { DataTable, type DataTableColumn } from "@/component/widget";

import type { BkdActivityResponse } from "../api/bkd_schemas";

type BkdActivityItem = BkdActivityResponse["items"][number];

type BkdActivityTableProps = {
  items: BkdActivityResponse["items"];
};

function formatNumber(value: number | null) {
  if (value === null) {
    return "-";
  }
  return value.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

export function BkdActivityTable({ items }: BkdActivityTableProps) {
  const columns: DataTableColumn<BkdActivityItem>[] = [
    {
      key: "sdm",
      header: "SDM",
      render: (item) => (
        <>
          <p className="font-medium text-[hsl(var(--color-text))]">{item.nm_sdm}</p>
          <p className="mt-1 text-xs text-[hsl(var(--color-muted))]">NIDN: {item.nidn}</p>
        </>
      ),
    },
    {
      key: "semester",
      header: "Semester",
      render: (item) => item.id_smt,
      className: "font-mono text-xs text-[hsl(var(--color-muted))]",
    },
    {
      key: "unsur",
      header: "Unsur",
      render: (item) => item.unsur,
      className: "text-xs text-[hsl(var(--color-muted))]",
    },
    {
      key: "judul",
      header: "Judul kegiatan",
      render: (item) => item.judul_keg,
      className: "max-w-xs text-sm text-[hsl(var(--color-text))]",
    },
    {
      key: "kategori",
      header: "Kategori",
      render: (item) => (
        <>
          <p>{item.nm_kat}</p>
          <p className="mt-1 font-mono">ID {item.id_katgiat}</p>
        </>
      ),
      className: "text-xs text-[hsl(var(--color-muted))]",
    },
    {
      key: "beban_sks",
      header: "Beban SKS",
      render: (item) => formatNumber(item.beban_sks),
      className: "text-right font-mono text-xs text-[hsl(var(--color-text))]",
    },
    {
      key: "nilai",
      header: "Nilai",
      render: (item) => formatNumber(item.nilai),
      className: "text-right font-mono text-xs text-[hsl(var(--color-text))]",
    },
  ];

  return (
    <DataTable
      caption="Daftar aktivitas BKD"
      columns={columns}
      getRowKey={(item, index) => `${item.id_smt}-${item.id_katgiat}-${index}`}
      rows={items}
      tableClassName="min-w-[1080px]"
    />
  );
}
