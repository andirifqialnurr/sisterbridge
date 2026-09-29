"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth_client";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function SessionMenu() {
  const router = useRouter();
  const session = authClient.useSession();
  const user = session.data?.user;

  if (!user) {
    // Fixture mode has no real session; keep the neutral avatar.
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-primary-soft))] text-xs font-bold text-[hsl(var(--color-primary-strong))]">
        DV
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-[hsl(var(--color-text))]">{user.name}</p>
        <p className="text-xs text-[hsl(var(--color-muted))]">{user.email}</p>
      </div>
      <div
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--color-primary-soft))] text-xs font-bold text-[hsl(var(--color-primary-strong))]"
      >
        {initials(user.name)}
      </div>
      <button
        aria-label="Keluar"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--color-muted))] transition-colors hover:bg-[hsl(var(--color-primary-soft))] hover:text-[hsl(var(--color-primary-strong))]"
        onClick={async () => {
          await authClient.signOut();
          router.replace("/login");
          router.refresh();
        }}
        title="Keluar"
        type="button"
      >
        <LogOut aria-hidden size={16} />
      </button>
    </div>
  );
}
