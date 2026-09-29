"use client";

import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { Select } from "@/component/ui/select";
import { useTRPC } from "@/lib/trpc";

type JelajahSdmPickerProps = {
  value: string;
  onChange: (sdmId: string) => void;
};

export function JelajahSdmPicker({ onChange, value }: JelajahSdmPickerProps) {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  // Keeps the chosen SDM selectable after the search text changes.
  const [selectedLabel, setSelectedLabel] = useState("");
  // Each search reaches SISTER (/referensi/sdm), so wait for typing to pause.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);
  const pegawaiQuery = useQuery(
    trpc.pegawai.search.queryOptions({
      search_by: "nama",
      search: debouncedSearch,
      page: 1,
      per_page: 50,
    }),
  );

  const results = (pegawaiQuery.data?.items ?? []).map((item) => ({
    label: `${item.nama_sdm}${item.nidn ? ` - ${item.nidn}` : ""}`,
    value: item.id_sdm,
  }));
  const options = [
    { label: "Pilih SDM", value: "" },
    ...(value && selectedLabel && !results.some((option) => option.value === value)
      ? [{ label: selectedLabel, value }]
      : []),
    ...results,
  ];

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <label htmlFor="jelajah-sdm-search">
        <span className="sr-only">Cari nama SDM</span>
        <input
          className="h-10 w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 text-sm text-[hsl(var(--color-text))] outline-none placeholder:text-[hsl(var(--color-muted))] focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary-soft))] sm:w-44"
          id="jelajah-sdm-search"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama SDM"
          type="search"
          value={search}
        />
      </label>
      <Select
        ariaLabel="Pilih SDM"
        disabled={pegawaiQuery.isPending || pegawaiQuery.isError}
        onValueChange={(nextValue) => {
          setSelectedLabel(options.find((option) => option.value === nextValue)?.label ?? "");
          onChange(nextValue);
        }}
        options={options}
        value={value}
      />
    </div>
  );
}
