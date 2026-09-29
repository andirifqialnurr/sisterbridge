"use client";

import { useState } from "react";

import { Check, Copy } from "lucide-react";

import { Button } from "@/component/ui/button";

import { toMarkdown, type FieldAnalysis, type StructureAnalysis } from "@/lib/field_analysis";

type StructureTableProps = {
  title: string;
  analysis: StructureAnalysis;
};

function typeBadges(field: FieldAnalysis) {
  return Object.entries(field.types).map(([type, count]) => (
    <span
      className="mr-1 mb-1 inline-block rounded bg-[hsl(var(--color-canvas))] px-1.5 py-0.5 font-mono text-[11px] text-[hsl(var(--color-muted))]"
      key={type}
    >
      {type}×{count}
    </span>
  ));
}

function flatten(fields: FieldAnalysis[], prefix = ""): { path: string; field: FieldAnalysis }[] {
  return fields.flatMap((field) => [
    { path: `${prefix}${field.field}`, field },
    ...(field.children ? flatten(field.children, `${prefix}${field.field}[].`) : []),
  ]);
}

export function StructureTable({ analysis, title }: StructureTableProps) {
  const [copied, setCopied] = useState(false);
  const rows = flatten(analysis.fields);

  if (rows.length === 0) {
    return <p className="text-sm text-[hsl(var(--color-muted))]">Tidak ada field untuk dianalisis.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[hsl(var(--color-muted))]">
          {rows.length} field dari {analysis.analyzedRows} baris
          {analysis.rows > analysis.analyzedRows ? ` (sampel dari ${analysis.rows})` : ""}. Usulan tipe
          adalah titik awal desain tabel replika, bukan kontrak resmi.
        </p>
        <Button
          onClick={async () => {
            await navigator.clipboard.writeText(toMarkdown(title, analysis));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          size="sm"
          variant="secondary"
        >
          {copied ? <Check aria-hidden size={14} /> : <Copy aria-hidden size={14} />}
          {copied ? "Tersalin" : "Salin markdown"}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <caption className="sr-only">Struktur data {title}</caption>
          <thead className="bg-[hsl(var(--color-canvas))] text-xs font-semibold text-[hsl(var(--color-muted))]">
            <tr>
              <th className="px-3 py-2" scope="col">Field</th>
              <th className="px-3 py-2" scope="col">Usulan tipe</th>
              <th className="px-3 py-2" scope="col">Null/kosong</th>
              <th className="px-3 py-2" scope="col">Tipe teramati</th>
              <th className="px-3 py-2" scope="col">Contoh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--color-border))]">
            {rows.map(({ path, field }) => {
              const total = field.present + field.missing;
              const emptyCount = field.nullish + field.missing;
              return (
                <tr key={path}>
                  <td className="px-3 py-2 align-top font-mono text-xs text-[hsl(var(--color-text))]">{path}</td>
                  <td className="px-3 py-2 align-top text-xs font-semibold text-[hsl(var(--color-primary-strong))]">
                    {field.suggested}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-[hsl(var(--color-muted))]">
                    {total === 0 ? "-" : `${Math.round((emptyCount / total) * 100)}%`}
                    {field.missing > 0 ? ` (${field.missing} tanpa field)` : ""}
                  </td>
                  <td className="px-3 py-2 align-top">{typeBadges(field)}</td>
                  <td className="max-w-[280px] px-3 py-2 align-top text-xs break-words text-[hsl(var(--color-text))]">
                    {field.examples.join(" · ") || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
