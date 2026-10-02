import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar";

const state = vi.hoisted(() => ({ pathname: "/", role: "ADMIN" as string | undefined }));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: state.role ? { role: state.role } : undefined }) }));
vi.mock("@/lib/trpc", () => ({ useTRPC: () => ({ overview: { session: { queryOptions: () => ({}) } } }) }));
vi.mock("@/hook/use-theme", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));
vi.mock("./theme_toggle", () => ({ ThemeToggle: () => null }));

beforeEach(() => { state.pathname = "/"; state.role = "ADMIN"; });

it("puts domain icons on parent menus and text only on their children", () => {
  const html = renderToStaticMarkup(<Sidebar />);
  const groups = [...html.matchAll(/<details[^>]*>(.*?)<\/details>/g)];
  expect(groups.length).toBe(11);
  for (const [, group] of groups) {
    expect(group.match(/<summary.*?<\/summary>/)?.[0]).toContain("<svg");
    expect(group.split("</summary>")[1]).not.toContain("<svg");
  }
  expect(html).toMatch(/aria-current="page"[^>]*href="\/"/);
});

it.each(["/jabatan_fungsional", "/referensi/jabatan_fungsional"])("selects only the correct duplicate label at %s", (pathname) => {
  state.pathname = pathname;
  const html = renderToStaticMarkup(<Sidebar activeLabel="Jabatan fungsional" />);
  const links = html.match(/<a[^>]*aria-current="page"[^>]*>/g) ?? [];
  expect(links).toHaveLength(1);
  expect(links[0]).toContain(`href="${pathname}"`);
  expect(html).toMatch(/<details open=""><summary[^>]*data-active="true"/);
});

it("keeps restricted menus hidden for an operator or pending session", () => {
  state.role = "OPERATOR";
  const html = renderToStaticMarkup(<Sidebar />);
  expect(html).toContain("Data Replika");
  expect(html).not.toContain("Audit security");
  expect(html).not.toContain("Pendidikan dan kompetensi");
  state.role = undefined;
  expect(renderToStaticMarkup(<Sidebar />)).not.toContain("Data Replika");
});
