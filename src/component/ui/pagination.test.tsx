import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { Pagination } from "./pagination";
import { DataTable } from "@/component/widget/data_table";

it("offers recovery for an empty out-of-range page even when only one page remains", () => {
  const html = renderToStaticMarkup(<Pagination page={3} pageCount={1} onPageChange={vi.fn()} />);
  expect(html).toContain("Kembali ke halaman pertama");
  expect(renderToStaticMarkup(<Pagination page={1} pageCount={1} onPageChange={vi.fn()} />)).toBe("");
});

it("wraps long pagination within narrow mobile containers", () => {
  const html = renderToStaticMarkup(<Pagination page={1734} pageCount={1734} onPageChange={vi.fn()} />);
  expect(html).toContain("max-w-full flex-wrap");
  expect(html).toContain('aria-current="page"');
  expect(html).toContain("1734");
});

it("labels independent pagination landmarks distinctly", () => {
  const html = renderToStaticMarkup(<Pagination ariaLabel="Halaman riwayat sinkronisasi" page={1} pageCount={3} onPageChange={vi.fn()} />);
  expect(html).toContain('aria-label="Halaman riwayat sinkronisasi"');
});

it("keeps pagination visible when a table page is empty", () => {
  const html = renderToStaticMarkup(<DataTable caption="Uji" columns={[]} rows={[]} getRowKey={() => "row"} pagination={<Pagination page={3} pageCount={5} onPageChange={vi.fn()} />} />);
  expect(html).toContain("Belum ada data");
  expect(html).toContain('aria-label="Halaman sebelumnya"');
});
