"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type ChartTable = {
  columns: string[];
  rows: (string | number)[][];
};

type ChartCardProps = {
  title: string;
  subtitle?: string;
  chart: ReactNode;
  // Every chart has a table view so no value depends on colour or hover.
  table: ChartTable;
  footer?: ReactNode;
  className?: string;
};

export function ChartCard({ chart, className, footer, subtitle, table, title }: ChartCardProps) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <article
      className={cn(
        "min-w-0 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5 shadow-[0_1px_2px_hsl(145_20%_20%/0.04)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[hsl(var(--color-text))]">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-[hsl(var(--color-muted))]">{subtitle}</p>}
        </div>
        <div
          aria-label={`Tampilan ${title}`}
          className="flex shrink-0 rounded-lg border border-[hsl(var(--color-border))] p-0.5 text-xs"
          role="group"
        >
          {(["chart", "table"] as const).map((option) => (
            <button
              aria-pressed={view === option}
              className={cn(
                "rounded-md px-2.5 py-1 font-semibold transition-colors",
                view === option
                  ? "bg-[hsl(var(--color-primary-soft))] text-[hsl(var(--color-primary-strong))]"
                  : "text-[hsl(var(--color-muted))] hover:text-[hsl(var(--color-text))]",
              )}
              key={option}
              onClick={() => setView(option)}
              type="button"
            >
              {option === "chart" ? "Grafik" : "Tabel"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {view === "chart" ? (
          chart
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">{title}</caption>
              <thead className="text-xs font-semibold text-[hsl(var(--color-muted))]">
                <tr className="border-b border-[hsl(var(--color-border))]">
                  {table.columns.map((column, index) => (
                    <th className={cn("px-2 py-2", index > 0 && "text-right")} key={column} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--color-border))]">
                {table.rows.map((row) => (
                  <tr key={String(row[0])}>
                    {row.map((cell, index) => (
                      <td
                        className={cn(
                          "px-2 py-1.5 text-[hsl(var(--color-text))]",
                          index > 0 && "text-right tabular-nums",
                        )}
                        key={`${String(row[0])}-${index}`}
                      >
                        {typeof cell === "number" ? cell.toLocaleString("id-ID") : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {footer && <div className="mt-3 text-xs text-[hsl(var(--color-muted))]">{footer}</div>}
    </article>
  );
}
