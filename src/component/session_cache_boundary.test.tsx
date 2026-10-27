import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { SessionCacheBoundary } from "./session_cache_boundary";

const session = vi.hoisted(() => ({ isPending: false, data: { user: { id: "account-one" }, session: { id: "session-one", expiresAt: "2099-01-01T00:00:00Z" } } }));
vi.mock("@/lib/auth_client", () => ({ authClient: { useSession: () => session } }));

it("does not render private children until the session cache barrier has completed", () => {
  session.data.session.expiresAt = "2099-01-01T00:00:00Z";
  const client = new QueryClient();
  client.setQueryData(["private"], "previous-account-data");
  const html = renderToStaticMarkup(<QueryClientProvider client={client}>
    <SessionCacheBoundary><p>Private account data</p></SessionCacheBoundary>
  </QueryClientProvider>);
  expect(html).toContain("Memuat sesi");
  expect(html).not.toContain("Private account data");
  client.clear();
});

it("does not render private children for an expired session snapshot", () => {
  session.data.session.expiresAt = "2000-01-01T00:00:00Z";
  const client = new QueryClient();
  const html = renderToStaticMarkup(<QueryClientProvider client={client}>
    <SessionCacheBoundary><p>Private account data</p></SessionCacheBoundary>
  </QueryClientProvider>);
  expect(html).toContain("Sesi sudah berakhir");
  expect(html).toContain("Masuk kembali");
  expect(html).not.toContain("Private account data");
  client.clear();
});
