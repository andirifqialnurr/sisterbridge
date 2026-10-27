"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export type UrlState = { values: Record<string, string>; ready: boolean; set: (values: Record<string, string | null>) => void };

export function useUrlState(): UrlState {
  const search = useSearchParams().toString();
  const values = useMemo(() => Object.fromEntries(new URLSearchParams(search).entries()), [search]);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const set = useCallback((next: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value); else params.delete(key);
    }
    const query = params.toString();
    window.history.pushState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, []);
  return { values, ready, set };
}
