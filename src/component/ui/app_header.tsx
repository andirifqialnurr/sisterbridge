"use client";

import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

import { SessionMenu } from "@/component/widget/session_menu";

type AppHeaderProps = {
  maxWidth: string;
};

export function AppHeader({ maxWidth }: AppHeaderProps) {
  const trpc = useTRPC();
  const session = useQuery(trpc.overview.session.queryOptions());
  return (
    <header className="border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
      <div
        className="mx-auto flex h-16 min-w-0 items-center justify-between gap-4 px-[30px]"
        style={{ maxWidth }}
      >
        {session.data?.role === "ADMIN" && <form action="/pegawai" method="get" className="relative hidden w-full max-w-[480px] sm:block" role="search">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-muted))]"
            size={15}
          />
          <label className="sr-only" htmlFor="global-search">
            Cari pegawai berdasarkan nama, NIDN, atau NIP
          </label>
          <input
            className="h-10 w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] pl-9 pr-3 text-sm text-[hsl(var(--color-text))] outline-none transition-colors placeholder:text-[hsl(var(--color-muted))] focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary-soft))]"
            id="global-search"
            name="search"
            placeholder="Cari pegawai (nama / NIDN / NIP)"
            type="search"
          />
        </form>}
        <div className="ml-auto"><SessionMenu /></div>
      </div>
    </header>
  );
}
