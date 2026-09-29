import { describe, expect, it } from "vitest";

import {
  buildMigrationSql,
  buildSchemaDoc,
  buildViewSpecs,
  sanitizeColumnName,
  viewNameFor,
} from "./replica_views";

const endpoints = [
  "/penelitian",
  "/penelitian/{id}",
  "/penelitian/{id}/bidang_ilmu",
  "/data_pribadi/profil/{id_sdm}",
  "/bkd/ajar",
  "/tunjangan",
  "/tunjangan/{id}",
];

describe("replica view naming", () => {
  it("derives view names and marks lists that have a detail endpoint", () => {
    const all = new Set(endpoints);
    expect(viewNameFor("/penelitian", all)).toBe("penelitian_list");
    expect(viewNameFor("/penelitian/{id}", all)).toBe("penelitian");
    expect(viewNameFor("/penelitian/{id}/bidang_ilmu", all)).toBe("penelitian_bidang_ilmu");
    expect(viewNameFor("/data_pribadi/profil/{id_sdm}", all)).toBe("data_pribadi_profil");
    expect(viewNameFor("/bkd/ajar", all)).toBe("bkd_ajar");
  });

  it("sanitizes column names and avoids meta column collisions", () => {
    expect(sanitizeColumnName("Nama-File")).toBe("nama_file");
    expect(sanitizeColumnName("1st")).toBe("f_1st");
    expect(sanitizeColumnName("r_payload")).toBe("f_r_payload");
  });
});

describe("buildViewSpecs", () => {
  const samples = new Map<string, unknown[]>([
    [
      "/penelitian/{id}",
      [
        {
          id: "11111111-2222-4333-8444-000000000001",
          judul: "Riset",
          tahun: 2024,
          dana: "1500000.00",
          nidn: "0012345678",
          detail_perubahan: { ipk_baru: "3.5" },
          anggota: [{ nama: "A", id_sdm: "11111111-2222-4333-8444-000000000009" }],
        },
      ],
    ],
    ["/penelitian", [{ id: "11111111-2222-4333-8444-000000000001", judul: "Riset" }]],
  ]);
  const specs = buildViewSpecs(samples, endpoints);
  const byName = Object.fromEntries(specs.map((spec) => [spec.name, spec]));

  it("types columns from observed payloads", () => {
    const types = Object.fromEntries(byName.penelitian.columns.map((column) => [column.name, column.type]));
    expect(types).toMatchObject({
      id: "uuid",
      judul: "text",
      tahun: "bigint",
      dana: "numeric",
      nidn: "text",
      detail_perubahan: "jsonb",
      detail_perubahan_ipk_baru: "numeric",
      anggota: "jsonb",
    });
  });

  it("creates child views for arrays of objects and empty views without samples", () => {
    expect(byName.penelitian_anggota).toMatchObject({ endpoint: "/penelitian/{id}", arrayField: "anggota" });
    expect(byName.penelitian_anggota.columns.map((column) => column.name)).toEqual(["nama", "id_sdm"]);
    expect(byName.tunjangan).toMatchObject({ sampleRows: 0, columns: [] });
    expect(byName.tunjangan_list.columns).toEqual([]);
  });

  it("emits SQL with safe casts, escaped literals, and no sample values in the doc", () => {
    const sql = buildMigrationSql(specs, "2026-09-29T00:00:00.000Z");
    expect(sql).toContain("DROP SCHEMA IF EXISTS replica CASCADE;");
    expect(sql).toContain("CREATE FUNCTION replica.try_uuid(value text) RETURNS uuid");
    expect(sql).toContain(`replica.try_uuid(r.payload_json->>'id') AS "id"`);
    expect(sql).toContain(`replica.try_numeric(r.payload_json->'detail_perubahan'->>'ipk_baru')`);
    expect(sql).toContain(`nullif(r.payload_json->>'nidn', '') AS "nidn"`);
    expect(sql).toContain("jsonb_array_elements(");
    expect(sql).toContain("WHERE r.endpoint = '/penelitian/{id}' AND r.deleted_at IS NULL");

    const doc = buildSchemaDoc(specs, "2026-09-29T00:00:00.000Z");
    expect(doc).toContain("## replica.penelitian_anggota");
    expect(doc).not.toContain("0012345678");
    expect(doc).not.toContain("Riset");
  });
});
