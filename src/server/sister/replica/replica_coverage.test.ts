import { describe, expect, it } from "vitest";
import { buildReplicaCoverage, type CoverageScopeCount } from "./replica_coverage";

const scope = (endpoint: string, status = 200, count = 1): CoverageScopeCount => ({
  endpoint, status, count, lastFetchedAt: new Date("2026-10-27T00:00:00Z"),
});

describe("replica coverage", () => {
  it("always lists all 135 JSON templates, not the five live/file GETs", () => {
    const result = buildReplicaCoverage([], []);
    expect(result.endpoints).toHaveLength(135);
    expect(new Set(result.endpoints.map(row => row.endpoint)).size).toBe(135);
    expect(result.summary).toMatchObject({ templates_with_records: 0, templates_with_scopes: 0, live_only_gets: 5, states: { never_fetched: 135 } });
    expect(result.endpoints.every(row => row.last_checked_at === null)).toBe(true);
  });

  it("distinguishes cached, empty, missing parent, errors, not found and never fetched", () => {
    const result = buildReplicaCoverage([
      { endpoint: "/penelitian", count: 4 },
      { endpoint: "/pendidikan_formal/ajuan/{id}", count: 3 },
      { endpoint: "/not-in-catalog", count: 999 },
    ], [
      scope("/penelitian"), scope("/bimbing_dosen"),
      scope("/pendidikan_formal/ajuan/{id}", 200, 2), scope("/pendidikan_formal/ajuan/{id}", 500),
      scope("/nilai_tes/{id}", 404), scope("/referensi/agama", 0),
      scope("/not-in-catalog"),
    ]);
    const row = (endpoint: string) => result.endpoints.find(row => row.endpoint === endpoint);
    expect(row("/penelitian")).toMatchObject({ state: "available", records: 4 });
    expect(row("/bimbing_dosen")).toMatchObject({ state: "empty" });
    expect(row("/bimbing_dosen/{id}")).toMatchObject({ state: "waiting_for_parent" });
    expect(row("/pendidikan_formal/ajuan/{id}")).toMatchObject({ state: "partial_or_failed", records: 3, scopes: 3, statuses: { 200: 2, 500: 1 } });
    expect(row("/nilai_tes/{id}")).toMatchObject({ state: "not_found" });
    expect(row("/referensi/agama")).toMatchObject({ state: "partial_or_failed" });
    expect(row("/dokumen")).toMatchObject({ state: "never_fetched" });
    expect(result.summary).toMatchObject({ active_records: 7, templates_with_records: 2, templates_with_scopes: 5 });
  });

  it("retains available records despite historical 403 and chooses the latest scope timestamp", () => {
    const result = buildReplicaCoverage([{ endpoint: "/kelas_kuliah/{id}/dokumen", count: 12 }], [
      scope("/kelas_kuliah/{id}/dokumen", 403, 74),
      { ...scope("/kelas_kuliah/{id}/dokumen"), lastFetchedAt: new Date("2026-10-28T00:00:00Z") },
    ]);
    expect(result.endpoints.find(row => row.endpoint === "/kelas_kuliah/{id}/dokumen")).toMatchObject({
      state: "partial_or_failed", records: 12, scopes: 75, last_checked_at: "2026-10-28T00:00:00.000Z",
    });
  });
});
