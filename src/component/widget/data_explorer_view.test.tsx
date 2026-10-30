import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DataExplorerView, type DataExplorerResult } from "./data_explorer_view";

const result: DataExplorerResult = {
  endpoint: "/referensi/agama", query: {}, shape: "array", item_count: 1,
  data: [{ id: "reference-1", nama: "Synthetic reference" }], fetched_at: "2026-10-30T00:00:00Z",
};

describe("submenu-owned explorer presentation", () => {
  it("shows data directly without tab navigation or hidden raw JSON", () => {
    const html = renderToStaticMarkup(<DataExplorerView result={result} title="Reference" />);
    expect(html).toContain("Synthetic reference");
    expect(html).toContain('<caption class="sr-only">Reference</caption>');
    expect(html).not.toContain('role="tab');
    expect(html).not.toContain("<pre");
    expect(html).toContain("data-explorer-diagnostics");
    expect(html).toContain("<summary");
    expect(html).toContain("Struktur data dan JSON");
    expect(html).not.toMatch(/<details[^>]*open/);
  });

  it("keeps server pagination and row actions outside a view switcher", () => {
    const html = renderToStaticMarkup(<DataExplorerView result={result} title="Reference"
      pagination={{ page: 2, pageCount: 10, total: 240, onPageChange: vi.fn() }}
      rowAction={() => <button type="button">Detail sample</button>} />);
    expect(html).toContain("Detail sample");
    expect(html).toContain("240 data");
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('role="tab');
  });

  it("renders object fields and empty results directly, escaping untrusted text", () => {
    const html = renderToStaticMarkup(<DataExplorerView result={{ ...result, shape: "object", data: { nama: "<script>bad</script>" } }} title="Object" />);
    expect(html).toContain("&lt;script&gt;bad&lt;/script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("<dl");
    const empty = renderToStaticMarkup(<DataExplorerView result={{ ...result, shape: "empty", item_count: 0, data: [] }} title="Empty" />);
    expect(empty).toContain("SISTER tidak mengembalikan data");
    expect(empty).not.toContain('role="tab');
  });
});
