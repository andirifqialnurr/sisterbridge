import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { buildReplicaCoverage } from "@/server/sister/replica/replica_coverage";
import { coveragePage, ReplicaCoverageTable } from "./replica_coverage_table";

const data = buildReplicaCoverage([{ endpoint: "/penelitian", count: 1234 }], [
  { endpoint: "/penelitian", status: 200, count: 3, lastFetchedAt: new Date("2026-10-27T00:00:00Z") },
]);

describe("coverage table", () => {
  it("pages the entire bounded catalog, including the final fifteen templates", () => {
    expect(coveragePage(data, "all", 1, 20).rows).toHaveLength(20);
    const last = coveragePage(data, "all", 999, 20);
    expect(last).toMatchObject({ page: 7, pageCount: 7, total: 135 });
    expect(last.rows).toHaveLength(15);
    expect(coveragePage(data, "unknown", 1, 20).selected).toBe("all");
  });

  it("filters and clamps stale page state, including an empty filter", () => {
    expect(coveragePage(data, "available", 7, 20)).toMatchObject({ page: 1, total: 1, rows: [expect.objectContaining({ endpoint: "/penelitian" })] });
    expect(coveragePage(data, "not_found", 7, 20)).toMatchObject({ page: 1, pageCount: 1, total: 0, rows: [] });
  });

  it("labels snapshot limits, cached counts and pagination accessibly", () => {
    const html = renderToStaticMarkup(<ReplicaCoverageTable data={data} filter="available" page={1} perPage={20}
      busy={false} onFilterChange={vi.fn()} onPageChange={vi.fn()} />);
    expect(html).toContain("snapshot database lokal");
    expect(html).toContain("bukan pengambilan live");
    expect(html).toContain("GET file/pencarian diperiksa terpisah");
    expect(html).toContain("Data tersedia");
    expect(html).toContain("1.234");
    expect(html).toContain("Filter coverage endpoint");
  });
});
