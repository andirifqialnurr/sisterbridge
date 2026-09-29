"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

export type ModuleNavItem = {
  key: string;
  label: string;
  group: string;
  kind: "sdm_list" | "sdm_object" | "referensi" | "search";
  // Optional record count shown as a badge (null = not applicable).
  count?: number | null;
};

type ModuleNavProps = {
  modules: ModuleNavItem[];
  value: string;
  onChange: (key: string) => void;
};

export function ModuleNav({ modules, onChange, value }: ModuleNavProps) {
  const [filter, setFilter] = useState("");
  const needle = filter.trim().toLowerCase();
  const visible = modules.filter(
    (module) => !needle || module.label.toLowerCase().includes(needle) || module.key.includes(needle),
  );
  const groups = [...new Set(visible.map((module) => module.group))];

  return (
    <nav aria-label="Modul SISTER" className="space-y-4">
      <label className="block" htmlFor="module-nav-filter">
        <span className="sr-only">Cari modul</span>
        <input
          className="h-9 w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 text-sm text-[hsl(var(--color-text))] outline-none placeholder:text-[hsl(var(--color-muted))] focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary-soft))]"
          id="module-nav-filter"
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Cari modul"
          type="search"
          value={filter}
        />
      </label>
      {groups.map((group) => (
        <div key={group}>
          <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--color-muted))]">
            {group}
          </p>
          <ul className="space-y-0.5">
            {visible
              .filter((module) => module.group === group)
              .map((module) => (
                <li key={module.key}>
                  <button
                    aria-current={module.key === value ? "page" : undefined}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      module.key === value
                        ? "bg-[hsl(var(--color-primary-soft))] font-semibold text-[hsl(var(--color-primary-strong))]"
                        : "text-[hsl(var(--color-text))] hover:bg-[hsl(var(--color-canvas))]",
                    )}
                    onClick={() => onChange(module.key)}
                    type="button"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span>{module.label}</span>
                      {typeof module.count === "number" && (
                        <span
                          className={cn(
                            "rounded px-1.5 text-[11px] font-semibold",
                            module.count > 0
                              ? "bg-[hsl(var(--color-primary-soft))] text-[hsl(var(--color-primary-strong))]"
                              : "text-[hsl(var(--color-muted))]",
                          )}
                        >
                          {module.count}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
      {groups.length === 0 && <p className="px-2 text-sm text-[hsl(var(--color-muted))]">Modul tidak ditemukan.</p>}
    </nav>
  );
}
