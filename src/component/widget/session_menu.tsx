"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth_client";
import { clearSessionQueryCache } from "@/lib/session_cache";

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
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    <div className="relative flex shrink-0 items-center gap-3">
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
        aria-busy={isSigningOut}
        disabled={isSigningOut}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--color-muted))] transition-colors hover:bg-[hsl(var(--color-primary-soft))] hover:text-[hsl(var(--color-primary-strong))]"
        onClick={async () => {
          setIsSigningOut(true);
          setError(null);
          try {
            const result = await authClient.signOut();
            if (result.error) {
              setError("Keluar belum berhasil. Coba lagi.");
              return;
            }
            await session.refetch();
            await clearSessionQueryCache(queryClient);
            router.replace("/login");
            router.refresh();
          } catch {
            setError("Keluar belum berhasil. Coba lagi.");
          } finally {
            setIsSigningOut(false);
          }
        }}
        title="Keluar"
        type="button"
      >
        <LogOut aria-hidden size={16} />
      </button>
      {error && <p className="absolute right-0 top-full z-30 mt-2 w-64 rounded-lg bg-[hsl(var(--color-danger-soft))] p-3 text-xs text-[hsl(var(--color-danger-strong))]" role="alert">{error}</p>}
    </div>
  );
}
