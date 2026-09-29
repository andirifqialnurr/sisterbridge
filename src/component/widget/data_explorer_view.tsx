"use client";

import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/component/ui/button";
import { Pagination } from "@/component/ui/pagination";
import { Tabs } from "@/component/ui/tabs";

import { analyzeRows, toRows } from "@/lib/field_analysis";

import { StructureTable } from "./structure_table";

const rowsPerPage = 25;
const maxColumns = 7;
const maxJsonItems = 50;

// Generic JSON rows result, as returned by the jelajah (live SISTER) and
// replika (local views) procedures. `data` is optional because tRPC infers
// `unknown` fields as optional on the client.
export type DataExplorerResult = {
  endpoint: string;
  query: Record<string, string>;
  shape: "array" | "object" | "empty";
  item_count: number;
  data?: unknown;
  fetched_at: string;
};

type DataExplorerViewProps = {
  title: string;
  result: DataExplorerResult;
  // First line above the tabs; defaults to "GET <endpoint>?<query>".
  sourceLabel?: string;
  // Renders a per-row action (e.g. "Detail") in list mode.
  rowAction?: (row: Record<string, unknown>) => ReactNode;
};

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-[hsl(var(--color-muted))]">-</span>;
  }
  if (Array.isArray(value)) {
    return <span className="text-[hsl(var(--color-muted))]">[{value.length} item]</span>;
  }
  if (typeof value === "object") {
    return <span className="text-[hsl(var(--color-muted))]">{"{objek}"}</span>;
  }
  if (typeof value === "boolean") {
    return value ? "Ya" : "Tidak";
  }
  const text = String(value);
  // UUIDs are shortened (full value on hover); ISO timestamps are shown in
  // local time. The JSON tab keeps the raw values.
  if (uuidPattern.test(text)) {
    return (
      <span className="font-mono text-xs text-[hsl(var(--color-muted))]" title={text}>
        {text.slice(0, 8)}…
      </span>
    );
  }
  if (isoTimestampPattern.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return <span title={text}>{date.toLocaleString("id-ID")}</span>;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return <span className="whitespace-nowrap">{text}</span>;
  }
  return text;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function isScalar(value: unknown) {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

export function DataExplorerView({ result, rowAction, sourceLabel, title }: DataExplorerViewProps) {
  const [tab, setTab] = useState("data");
  const [page, setPage] = useState(1);
  const rows = useMemo(() => toRows(result.data) as Record<string, unknown>[], [result.data]);
  const analysis = useMemo(() => analyzeRows(rows), [rows]);

  const columns = analysis.fields
    .filter((field) => rows.some((row) => isScalar(row[field.field])))
    .slice(0, maxColumns)
    .map((field) => field.field);
  const pageCount = Math.ceil(rows.length / rowsPerPage);
  const pageRows = rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const isSingleObject = result.shape === "object";

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs text-[hsl(var(--color-muted))]">
        {sourceLabel ??
          `GET ${result.endpoint}${
            Object.keys(result.query).length > 0
              ? `?${new URLSearchParams(result.query).toString()}`
              : ""
          }`}{" "}
        · {result.item_count} item · {new Date(result.fetched_at).toLocaleString("id-ID")}
      </p>
      <Tabs
        ariaLabel={`Tampilan ${title}`}
        items={[
          { value: "data", label: "Data" },
          { value: "struktur", label: "Struktur data" },
          { value: "json", label: "JSON" },
        ]}
        onValueChange={setTab}
        value={tab}
      >
        <div className="pt-3">
          {tab === "data" && rows.length === 0 && (
            <p className="rounded-lg border border-dashed border-[hsl(var(--color-border))] p-4 text-sm text-[hsl(var(--color-muted))]">
              SISTER tidak mengembalikan data untuk permintaan ini.
            </p>
          )}

          {tab === "data" && rows.length > 0 && isSingleObject && (
            <dl className="grid gap-x-6 gap-y-3 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 sm:grid-cols-2 xl:grid-cols-3">
              {Object.entries(rows[0]).map(([field, value]) => (
                <div className="min-w-0" key={field}>
                  <dt className="font-mono text-[11px] text-[hsl(var(--color-muted))]">{field}</dt>
                  <dd className="mt-0.5 break-words text-sm text-[hsl(var(--color-text))]">{formatCell(value)}</dd>
                </div>
              ))}
            </dl>
          )}

          {tab === "data" && rows.length > 0 && !isSingleObject && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <caption className="sr-only">{title}</caption>
                  <thead className="bg-[hsl(var(--color-canvas))] text-xs font-semibold text-[hsl(var(--color-muted))]">
                    <tr>
                      {columns.map((column) => (
                        <th className="px-3 py-2 font-mono" key={column} scope="col">
                          {column}
                        </th>
                      ))}
                      {rowAction && <th className="px-3 py-2" scope="col"><span className="sr-only">Aksi</span></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--color-border))]">
                    {pageRows.map((row, index) => (
                      <tr key={String(row.id ?? `${page}-${index}`)}>
                        {columns.map((column) => (
                          <td className="max-w-[260px] px-3 py-2 align-top break-words" key={column}>
                            {formatCell(row[column])}
                          </td>
                        ))}
                        {rowAction && <td className="px-3 py-2 text-right align-top">{rowAction(row)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {analysis.fields.length > columns.length && (
                <p className="text-xs text-[hsl(var(--color-muted))]">
                  Menampilkan {columns.length} dari {analysis.fields.length} field. Field lengkap ada di tab
                  Struktur data dan JSON.
                </p>
              )}
              <Pagination onPageChange={setPage} page={page} pageCount={pageCount} />
            </div>
          )}

          {tab === "struktur" && <StructureTable analysis={analysis} title={title} />}

          {tab === "json" && (
            <div className="space-y-2">
              {rows.length > maxJsonItems && (
                <p className="text-xs text-[hsl(var(--color-muted))]">
                  Menampilkan {maxJsonItems} item pertama dari {rows.length}.
                </p>
              )}
              <pre className="max-h-[520px] overflow-auto rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-canvas))] p-3 font-mono text-xs text-[hsl(var(--color-text))]">
                {JSON.stringify(
                  Array.isArray(result.data) ? result.data.slice(0, maxJsonItems) : result.data,
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}

export function DetailButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick} size="sm" variant="secondary">
      Detail
    </Button>
  );
}
