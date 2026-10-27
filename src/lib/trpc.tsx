"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState, type ReactNode } from "react";

import type { AppRouter } from "@/server/trpc/router";
import { SessionCacheBoundary } from "@/component/session_cache_boundary";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function TrpcProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
          url: `${
            typeof window === "undefined"
              ? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
              : window.location.origin
          }/api/trpc`,
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <SessionCacheBoundary>{children}</SessionCacheBoundary>
      </TRPCProvider>
    </QueryClientProvider>
  );
}
