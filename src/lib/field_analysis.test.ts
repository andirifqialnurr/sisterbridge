import { describe, expect, it } from "vitest";

import { analyzeRows, toMarkdown, toRows } from "./field_analysis";

describe("analyzeRows", () => {
  it("reports observed types, nullability, and suggested column types", () => {
    const analysis = analyzeRows([
      {
        id: "11111111-2222-4333-8444-000000000001",
        sks: "9.5000",
        tahun: 2023,
        ipk: 3.71,
        tanggal: "2023-03-17",
        judul: "Membimbing Skripsi",
        keluar: null,
        aktif: true,
      },
      {
        id: "11111111-2222-4333-8444-000000000002",
        sks: "0.0000",
        tahun: 2024,
        ipk: 4,
        tanggal: "2024-01-02",
        judul: "Kuliah",
        keluar: "",
        aktif: false,
      },
    ]);

    const byField = Object.fromEntries(analysis.fields.map((field) => [field.field, field]));
    expect(byField.id.suggested).toBe("uuid");
    expect(byField.sks.suggested).toBe("numeric (dikirim sebagai string)");
    expect(byField.tahun.suggested).toBe("integer");
    expect(byField.ipk.suggested).toBe("numeric");
    expect(byField.tanggal.suggested).toBe("date");
    expect(byField.aktif.suggested).toBe("boolean");
    expect(byField.judul).toMatchObject({ nullable: false, maxLength: 18 });
    expect(byField.keluar).toMatchObject({ nullable: true, nullish: 2, suggested: "text (selalu kosong)" });
  });

  it("marks fields missing from some rows as nullable and analyzes nested arrays", () => {
    const analysis = analyzeRows([
      { id: "1", dokumen: [{ id: "d1", nama: "SK" }] },
      { id: "2", extra: "x", dokumen: [] },
    ]);

    const extra = analysis.fields.find((field) => field.field === "extra");
    expect(extra).toMatchObject({ missing: 1, nullable: true });
    const dokumen = analysis.fields.find((field) => field.field === "dokumen");
    expect(dokumen?.suggested).toBe("jsonb (array)");
    expect(dokumen?.children?.map((field) => field.field)).toEqual(["id", "nama"]);
  });

  it("renders a markdown table including nested fields", () => {
    const markdown = toMarkdown("Penelitian", analyzeRows([{ id: 1, dokumen: [{ nama: "SK|A" }] }]));

    expect(markdown).toContain("| `id` | integer | tidak |");
    expect(markdown).toContain("`dokumen[].nama`");
    expect(markdown).toContain("SK\\|A");
  });

  it("normalizes payload shapes to rows", () => {
    expect(toRows([{ a: 1 }])).toHaveLength(1);
    expect(toRows({ a: 1 })).toEqual([{ a: 1 }]);
    expect(toRows({})).toEqual([]);
    expect(toRows(null)).toEqual([]);
  });
});
