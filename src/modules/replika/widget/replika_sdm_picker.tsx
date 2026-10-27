"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pagination } from "@/component/ui/pagination";
import { Select } from "@/component/ui/select";
import { useTRPC } from "@/lib/trpc";

type ReplikaSdmPickerProps = { value: string; onChange: (sdmId: string) => void };

// All filtering and pagination stay in the local replica, including for
// operators who cannot use the admin-only business procedures.
export function ReplikaSdmPicker({ onChange, value }: ReplikaSdmPickerProps) {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<{ label: string; value: string } | null>(null);
  const query = useQuery(trpc.replika.rows.queryOptions({ module: "ref_sdm", search, page, per_page: 100 }));
  const results = (query.data?.data ?? []).map((row) => ({
    label: `${String(row.nama_sdm ?? "-")}${row.nidn ? ` · ${String(row.nidn)}` : ""}`,
    value: String(row.id_sdm ?? ""),
  })).filter((option) => option.value);
  if (value && !results.some((option) => option.value === value)) {
    results.unshift(selected?.value === value ? selected : { value, label: value });
  }
  return <div className="flex min-w-0 max-w-full flex-col gap-2">
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <label className="min-w-0"><span className="sr-only">Cari nama SDM</span><input
        className="h-10 w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 text-sm outline-none focus:border-[hsl(var(--color-primary))] sm:w-44"
        onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nama / NIDN" type="search" value={search}
      /></label>
      <Select ariaLabel="Pilih SDM" disabled={query.isPending || query.isError} onValueChange={(next) => {
        setSelected(results.find((option) => option.value === next) ?? null); onChange(next);
      }} options={[{ label: `Pilih SDM (${query.data?.total ?? 0})`, value: "" }, ...results]} value={value} />
    </div>
    {query.data && query.data.total > 100 && <Pagination page={page} pageCount={Math.ceil(query.data.total / query.data.per_page)} onPageChange={setPage} disabled={query.isFetching} />}
    {query.isError && <span className="text-xs text-[hsl(var(--color-muted))]">Daftar SDM replika belum dapat dimuat.</span>}
  </div>;
}
