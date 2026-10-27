import type { ReactNode } from "react";

import { State } from "@/component/ui/state";
import { cn } from "@/lib/cn";

export type DataTableColumn<Row> = {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  className?: string;
};

type DataTableProps<Row> = {
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row, index: number) => string | number;
  loading?: boolean;
  error?: ReactNode;
  empty?: ReactNode;
  pagination?: ReactNode;
  className?: string;
  tableClassName?: string;
};

export function DataTable<Row>({
  caption,
  className,
  columns,
  empty = "Belum ada data.",
  error,
  getRowKey,
  loading = false,
  pagination,
  rows,
  tableClassName,
}: DataTableProps<Row>) {
  return (
    <section className={cn("min-w-0 space-y-3", className)}>
      {loading && <State description="Mohon tunggu sebentar." title="Memuat data..." tone="loading" />}
      {!loading && error && (
        <State
          description="Silakan coba lagi atau periksa konfigurasi integrasi."
          title="Data belum dapat dimuat"
          tone="error"
        >
          {error}
        </State>
      )}
      {!loading && !error && rows.length === 0 && (
        <State description={typeof empty === "string" ? empty : undefined} title="Belum ada data">
          {typeof empty === "string" ? undefined : empty}
        </State>
      )}
      {!loading && !error && rows.length > 0 && (
        <>
          <div
            aria-label={caption}
            className="table-shell overflow-x-auto rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]"
            role="region"
          >
            <table
              className={cn(
                "w-full min-w-[640px] border-collapse text-left text-sm",
                tableClassName,
              )}
            >
              <caption className="sr-only">{caption}</caption>
              <thead className="bg-[hsl(var(--color-canvas))] text-xs font-semibold text-[hsl(var(--color-muted))]">
                <tr>
                  {columns.map((column) => (
                    <th className={cn("px-4 py-3", column.className)} key={column.key} scope="col">
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--color-border))]">
                {rows.map((row, index) => (
                  <tr className="min-h-12" key={getRowKey(row, index)}>
                    {columns.map((column) => (
                      <td className={cn("px-4 py-3 align-top", column.className)} key={column.key}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {!loading && !error && pagination}
    </section>
  );
}
