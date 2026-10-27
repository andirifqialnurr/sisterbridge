"use client";

import { useEffect, useState } from "react";

import { CalendarDays } from "lucide-react";

type DatePickerProps = {
  ariaLabel?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function DatePicker({
  ariaLabel = "Pilih tanggal",
  onValueChange,
  placeholder = "yyyy-mm-dd",
  value,
}: DatePickerProps) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <label className="relative inline-flex h-10 min-w-[160px] items-center">
      <CalendarDays
        aria-hidden
        className="pointer-events-none absolute left-3 text-[hsl(var(--color-muted))]"
        size={15}
      />
      <span className="sr-only">{ariaLabel}</span>
      <input
        className="h-10 w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] pl-9 pr-3 text-sm text-[hsl(var(--color-text))] outline-none transition-colors placeholder:text-[hsl(var(--color-muted))] focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary-soft))]"
        inputMode="numeric"
        onBlur={() => onValueChange(draft)}
        onChange={(event) => setDraft(event.target.value)}
        pattern="\d{4}-\d{2}-\d{2}"
        placeholder={placeholder}
        value={draft}
      />
    </label>
  );
}
