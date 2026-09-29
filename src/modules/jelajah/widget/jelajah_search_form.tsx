"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { Button } from "@/component/ui/button";
import { Select } from "@/component/ui/select";
import { useTRPC } from "@/lib/trpc";

export type JelajahSearchValues = Partial<Record<"nama" | "nik" | "keyword" | "id_program_studi", string>>;

type SearchField = {
  name: keyof JelajahSearchValues;
  label: string;
  input: "text" | "prodi";
  required: boolean;
};

const inputClassName =
  "h-10 w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 text-sm text-[hsl(var(--color-text))] outline-none placeholder:text-[hsl(var(--color-muted))] focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary-soft))]";

// Program studi options come from the PT's own unit_kerja (id_jenis_unit 3),
// read live only when a module actually asks for it.
function ProdiSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const trpc = useTRPC();
  const unitQuery = useQuery({
    ...trpc.jelajah.list.queryOptions({ module: "ref_unit_kerja" }),
    staleTime: 10 * 60 * 1000,
  });
  const rows = Array.isArray(unitQuery.data?.data) ? (unitQuery.data.data as Record<string, unknown>[]) : [];
  const options = rows
    .filter((row) => Number(row.id_jenis_unit) === 3 && typeof row.id === "string")
    .map((row) => ({ label: String(row.nama ?? row.id), value: String(row.id) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Select
      ariaLabel="Pilih program studi"
      disabled={unitQuery.isPending || unitQuery.isError}
      onValueChange={onChange}
      options={[{ label: unitQuery.isError ? "Prodi gagal dimuat" : "Pilih program studi", value: "" }, ...options]}
      value={value}
    />
  );
}

export function JelajahSearchForm({
  fields,
  onSubmit,
}: {
  fields: SearchField[];
  onSubmit: (values: JelajahSearchValues) => void;
}) {
  const [values, setValues] = useState<JelajahSearchValues>({});
  const set = (name: keyof JelajahSearchValues, value: string) => setValues((current) => ({ ...current, [name]: value }));

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 md:flex-row md:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(
          Object.fromEntries(
            Object.entries(values)
              .map(([name, value]) => [name, value?.trim()])
              .filter(([, value]) => Boolean(value)),
          ),
        );
      }}
    >
      {fields.map((field) => (
        <label className="block min-w-0 flex-1 space-y-1.5" htmlFor={`jelajah-search-${field.name}`} key={field.name}>
          <span className="text-xs font-semibold text-[hsl(var(--color-text))]">
            {field.label}
            {field.required ? " *" : ""}
          </span>
          {field.input === "prodi" ? (
            <ProdiSelect onChange={(value) => set(field.name, value)} value={values[field.name] ?? ""} />
          ) : (
            <input
              className={inputClassName}
              id={`jelajah-search-${field.name}`}
              minLength={field.name === "nik" ? 3 : 3}
              onChange={(event) => set(field.name, event.target.value)}
              placeholder={field.name === "nik" ? "Angka NIK" : "Minimal 3 huruf"}
              value={values[field.name] ?? ""}
            />
          )}
        </label>
      ))}
      <Button type="submit">
        <Search aria-hidden size={15} />
        Cari di SISTER
      </Button>
    </form>
  );
}
