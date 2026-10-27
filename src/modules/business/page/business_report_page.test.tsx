import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { BusinessReportPage } from "./business_report_page";

const state = vi.hoisted(() => ({ data: {
  groups: [{ module: "penelitian", tahun: 2026, total: 1, participations: 3 }],
  rows: [{ id: "activity-1", id_sdm: "00000000-0000-4000-8000-000000000001", judul: "Synthetic activity", nama_sdm: "Synthetic owner" as string | null, owner_available: true, tahun: 2026 }],
  total: 1, page: 1, per_page: 50,
  source: { scope_count: 98, failed_scope_count: 2, not_found_scope_count: 1, oldest_fetch_at: null },
} }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: state.data, isPending: false }) }));
vi.mock("@/lib/trpc", () => ({ useTRPC: () => ({ business: { report: { queryOptions: () => ({}) } } }) }));
vi.mock("@/component/ui/page_shell", () => ({ PageShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/component/widget/chart_card", () => ({ ChartCard: () => null }));
vi.mock("@/modules/overview/widget/overview_charts", () => ({ BkdSemesterChart: () => null, LuaranTrendChart: () => null, StatusBarChart: () => null }));
vi.mock("./business_shared", () => ({
  useUrlState: () => ({ values: { jenis: "luaran", module: "penelitian", tahun: "2026" }, ready: true, set: vi.fn() }),
  formatValue: (value: unknown) => value == null ? "—" : String(value),
  ErrorState: () => null, PageError: () => null,
}));

beforeEach(() => {
  state.data.rows[0].judul = "Synthetic activity";
  state.data.rows[0].nama_sdm = "Synthetic owner";
  state.data.rows[0].owner_available = true;
});

it("shows activity/owner labels rather than raw SDM IDs in report cells", () => {
  const html = renderToStaticMarkup(<BusinessReportPage />);
  const visibleText = html.replace(/<[^>]+>/g, "");
  expect(visibleText).toContain("Synthetic activity");
  expect(visibleText).toContain("Synthetic owner");
  expect(visibleText).not.toContain(state.data.rows[0].id_sdm);
  expect(html).toContain('href="/penelitian/activity-1?id_sdm=');
  expect(visibleText).toContain("2 status non-200 (1 HTTP 404)");
});

it("does not offer a record link when no current owner is indexed", () => {
  state.data.rows[0].owner_available = false;
  state.data.rows[0].nama_sdm = null;
  const html = renderToStaticMarkup(<BusinessReportPage />);
  expect(html).toContain("SDM belum terindeks");
  expect(html).toContain("Detail belum tersedia");
  expect(html).not.toContain('href="/penelitian/activity-1');
});

it("renders untrusted activity titles as text, not HTML", () => {
  state.data.rows[0].judul = "<script>alert(1)</script>";
  const html = renderToStaticMarkup(<BusinessReportPage />);
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
});
