import { Search } from "lucide-react";

import { SessionMenu } from "@/component/widget/session_menu";

type AppHeaderProps = {
  maxWidth: string;
};

export function AppHeader({ maxWidth }: AppHeaderProps) {
  return (
    <header className="border-b border-[hsl(var(--color-border))] bg-white">
      <div
        className="mx-auto flex h-16 min-w-0 items-center justify-between gap-4 px-[40px]"
        style={{ maxWidth }}
      >
        <form className="relative hidden w-full max-w-[480px] sm:block" role="search">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-muted))]"
            size={15}
          />
          <label className="sr-only" htmlFor="global-search">
            Cari
          </label>
          <input
            className="h-10 w-full rounded-lg border border-[hsl(var(--color-border))] bg-white pl-9 pr-3 text-sm text-[hsl(var(--color-text))] outline-none transition-colors placeholder:text-[hsl(var(--color-muted))] focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary-soft))]"
            id="global-search"
            placeholder="Cari di workspace"
            type="search"
          />
        </form>
        <SessionMenu />
      </div>
    </header>
  );
}
