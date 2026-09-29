import { describe, expect, it, vi } from "vitest";

import type { ReplikaDashboardRepository } from "../repository/replika_dashboard_repository";
import { getReplikaDashboard, semesterLabel } from "./replika_dashboard_service";

function repository(overrides: Partial<ReplikaDashboardRepository> = {}): ReplikaDashboardRepository {
  return {
    sdmComposition: vi.fn().mockResolvedValue([
      { jenis_sdm: "Dosen", status_aktif: "Aktif", total: 60 },
      { jenis_sdm: "Dosen", status_aktif: "IJIN BELAJAR", total: 10 },
      { jenis_sdm: "Tenaga Kependidikan", status_aktif: "Aktif", total: 5 },
    ]),
    syncedSdmCount: vi.fn().mockResolvedValue(12),
    publikasiPerTahun: vi.fn().mockResolvedValue([{ tahun: 2025, total: 4 }, { tahun: 2010, total: 9 }]),
    penelitianPerTahun: vi.fn().mockResolvedValue([{ tahun: 2026, total: 2 }]),
    pengabdianPerTahun: vi.fn().mockRejectedValue(new Error('relation "replica.pengabdian_list" does not exist')),
    bkdPerSemester: vi.fn().mockResolvedValue([
      { id_smt: "20241", simpulan: "M", total: 8 },
      { id_smt: "20241", simpulan: "T", total: 2 },
      { id_smt: "20232", simpulan: "M", total: 7 },
    ]),
    lastSync: vi.fn().mockResolvedValue({
      status: "PARTIAL",
      baseUrl: "https://sister-api.kemdiktisaintek.go.id/ws-sandbox.php/1.0/",
      startedAt: new Date("2026-09-29T04:00:00Z"),
      finishedAt: new Date("2026-09-29T04:30:00Z"),
    }),
    ...overrides,
  };
}

describe("replika dashboard", () => {
  it("aggregates SDM composition, coverage, and last sync", async () => {
    const dashboard = await getReplikaDashboard(repository(), new Date("2026-09-29T00:00:00Z"));

    expect(dashboard.sdm).toMatchObject({ total: 75, dosen: 70, dosen_aktif: 60, tendik: 5 });
    expect(dashboard.sdm?.by_status[0]).toEqual({ label: "Aktif", total: 65 });
    expect(dashboard.coverage).toEqual({ synced_sdm: 12, total_sdm: 75 });
    expect(dashboard.last_sync).toMatchObject({ status: "PARTIAL", target: "sandbox" });
  });

  it("builds a ten-year trend, dropping a section whose view is missing", async () => {
    const dashboard = await getReplikaDashboard(repository(), new Date("2026-09-29T00:00:00Z"));

    expect(dashboard.luaran?.years).toEqual([2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]);
    expect(dashboard.luaran?.series.map((series) => series.key)).toEqual(["publikasi", "penelitian"]);
    expect(dashboard.luaran?.series[0].data.at(-2)).toBe(4);
    expect(dashboard.luaran?.series[0].data.reduce((sum, value) => sum + value, 0)).toBe(4);
  });

  it("splits BKD conclusions per semester in order", async () => {
    const dashboard = await getReplikaDashboard(repository(), new Date("2026-09-29T00:00:00Z"));

    expect(dashboard.bkd?.semesters).toEqual([
      { id_smt: "20232", label: "2023/24 Genap", memenuhi: 7, tidak_memenuhi: 0 },
      { id_smt: "20241", label: "2024/25 Ganjil", memenuhi: 8, tidak_memenuhi: 2 },
    ]);
    expect(semesterLabel("abc")).toBe("abc");
  });
});
