"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { Select } from "@/component/ui/select";
import { useTRPC } from "@/lib/trpc";

type ReplikaSdmPickerProps = {
  value: string;
  onChange: (sdmId: string) => void;
};

// Reads the SDM index from the local replica (replica.referensi_sdm), so
// picking and searching never calls SISTER.
export function ReplikaSdmPicker({ onChange, value }: ReplikaSdmPickerProps) {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const sdmQuery = useQuery(trpc.replika.rows.queryOptions({ module: "ref_sdm" }));

  const needle = search.trim().toLowerCase();
  const all = (sdmQuery.data?.data ?? []).map((row) => ({
    label: `${String(row.nama_sdm ?? "-")}${row.nidn ? ` - ${String(row.nidn)}` : ""}`,
    value: String(row.id_sdm ?? ""),
  }));
  const filtered = all.filter(
    (option) => option.value && (!needle || option.label.toLowerCase().includes(needle)),
  );
  const selected = all.find((option) => option.value === value);
  const options = [
    { label: `Pilih SDM (${all.length})`, value: "" },
    ...(selected && !filtered.includes(selected) ? [selected] : []),
    ...filtered.sort((a, b) => a.label.localeCompare(b.label)),
  ];

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <label htmlFor="replika-sdm-search">
        <span className="sr-only">Cari nama SDM</span>
        <input
          className="h-10 w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 text-sm text-[hsl(var(--color-text))] outline-none placeholder:text-[hsl(var(--color-muted))] focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary-soft))] sm:w-44"
          id="replika-sdm-search"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama / NIDN"
          type="search"
          value={search}
        />
      </label>
      <Select
        ariaLabel="Pilih SDM"
        disabled={sdmQuery.isPending || sdmQuery.isError}
        onValueChange={onChange}
        options={options}
        value={value}
      />
    </div>
  );
}
