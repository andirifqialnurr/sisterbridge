"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth_client";
import { clearSessionQueryCache, sessionCacheIdentity } from "@/lib/session_cache";
import { scheduleSessionExpiry, sessionExpiryTime } from "@/lib/session_expiry";

export function SessionCacheBoundary({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const session = authClient.useSession();
  const owner = sessionCacheIdentity(session.data);
  const refetchSession = session.refetch;
  const [acceptedOwner, setAcceptedOwner] = useState<string | null>(null);
  const [failedOwner, setFailedOwner] = useState<string | null>(null);
  const [, setExpiryEpoch] = useState(0);
  const expiresAt = session.data?.user ? sessionExpiryTime(session.data.session.expiresAt) ?? 0 : null;

  useEffect(() => {
    if (session.isPending) return;
    let active = true;
    setFailedOwner(null);
    void clearSessionQueryCache(client).then(() => {
      if (active) setAcceptedOwner(owner);
    }, () => {
      if (active) setFailedOwner(owner);
    });
    return () => { active = false; };
  }, [client, owner, session.isPending]);

  useEffect(() => {
    if (expiresAt === null) return;
    let active = true;
    const cancel = scheduleSessionExpiry(expiresAt, () => {
      setExpiryEpoch(value => value + 1);
      const refresh = () => { if (active) void refetchSession().catch(() => {}); };
      void clearSessionQueryCache(client).then(refresh, refresh);
    });
    return () => { active = false; cancel(); };
  }, [client, expiresAt, owner, refetchSession]);

  if (expiresAt !== null && expiresAt <= Date.now()) {
    return <p className="p-[30px] text-sm" role="alert">Sesi sudah berakhir. <button className="font-semibold underline" onClick={() => window.location.assign("/login")} type="button">Masuk kembali</button>.</p>;
  }
  if (failedOwner === owner) {
    return <p className="p-[30px] text-sm" role="alert">Sesi belum dapat disiapkan. Muat ulang halaman.</p>;
  }
  // An identity change must never render children using the previous cache.
  // Background checks for an unchanged identity do not unmount login inputs.
  if (acceptedOwner !== owner) {
    return <p className="p-[30px] text-sm" role="status">Memuat sesi...</p>;
  }
  return children;
}
