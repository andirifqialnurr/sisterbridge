"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/component/ui/button";

type TableSearchProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onSearch: () => void;
  onClear?: () => void;
};

export function TableSearch({ label, value, onValueChange, onSearch, onClear }: TableSearchProps) {
  return <form className="flex w-full min-w-0 items-center gap-2 sm:w-auto" onSubmit={(event) => { event.preventDefault(); onSearch(); }} role="search">
    <label className="relative min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-muted))]" size={15} />
      <input className="h-10 w-full min-w-0 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] pl-9 pr-3 text-sm outline-none focus:border-[hsl(var(--color-primary))] sm:w-44" onChange={(event) => onValueChange(event.target.value)} placeholder={label} type="search" value={value} />
    </label>
    <Button type="submit">Cari</Button>
    {onClear && <button aria-label="Hapus pencarian" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[hsl(var(--color-muted))] hover:bg-[hsl(var(--color-primary-soft))] focus-visible:outline-2 focus-visible:outline-[hsl(var(--color-primary))]" onClick={onClear} type="button"><X aria-hidden size={16} /></button>}
  </form>;
}
