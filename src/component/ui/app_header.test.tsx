import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { AppHeader } from "./app_header";

const state = vi.hoisted(() => ({ role: undefined as string | undefined }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: state.role ? { role: state.role } : undefined }) }));
vi.mock("@/lib/trpc", () => ({ useTRPC: () => ({ overview: { session: { queryOptions: () => ({}) } } }) }));
vi.mock("@/component/widget/session_menu", () => ({ SessionMenu: () => <span>Session</span> }));

it("submits ADMIN header searches to the directory's URL-state filter", () => {
  state.role = "ADMIN";
  const html = renderToStaticMarkup(<AppHeader maxWidth="none" />);
  expect(html).toContain('action="/pegawai"');
  expect(html).toContain('method="get"');
  expect(html).toContain('name="search"');
  expect(html).toContain("nama, NIDN, atau NIP");
});

it.each([undefined, "OPERATOR", "REVIEWER", "VIEWER"])("does not offer inaccessible directory search to %s", role => {
  state.role = role;
  const html = renderToStaticMarkup(<AppHeader maxWidth="none" />);
  expect(html).not.toContain('role="search"');
  expect(html).toContain("Session");
});
