import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { appRouter } from "@/server/trpc/router";
import { SisterNotFoundError } from "@/server/sister/errors";
import { replikaItemInputSchema, replikaSyncStatusInputSchema } from "./replika_schemas";

import { PrismaReplikaRepository, toJsonSafe, type ReplikaRepository } from "../repository/replika_repository";
import {
  getReplikaCoverage,
  getReplikaItem,
  getReplikaRows,
  getReplikaSyncStatus,
  listReplikaModules,
  ReplikaUnavailableError,
} from "./replika_service";

const idSdm = "8fe6735c-6e28-43e7-9eb3-3ae092bbcd62";
const integrationId = "00000000-0000-4000-8000-000000000099";
vi.mock("@/server/sister/config", () => ({
  getSisterConfig: () => ({ integration_id: "00000000-0000-4000-8000-000000000099", fixture_mode: true }),
  getSisterConfigurationStatus: () => ({ mode: "fixture", configuration: "ready" }),
}));

function fakeRepository(overrides: Partial<ReplikaRepository> = {}): ReplikaRepository {
  return {
    coverageCounts: vi.fn().mockResolvedValue({ records: [], scopes: [] }),
    listViews: vi.fn().mockResolvedValue([
      { name: "penelitian_list", comment: "SISTER /penelitian (generated)" },
      { name: "penelitian", comment: "SISTER /penelitian/{id} (generated)" },
      { name: "penelitian_anggota", comment: "SISTER /penelitian/{id} -> anggota[] (generated)" },
      { name: "penelitian_bidang_ilmu", comment: "SISTER /penelitian/{id}/bidang_ilmu (generated)" },
      { name: "referensi_wilayah", comment: "SISTER /referensi/wilayah (generated)" },
    ]),
    columns: vi.fn().mockResolvedValue([
      { name: "r_id_sdm", dataType: "character varying" },
      { name: "r_payload", dataType: "jsonb" },
      { name: "r_fetched_at", dataType: "timestamp without time zone" },
      { name: "id", dataType: "uuid" },
      { name: "tanggal", dataType: "date" },
      { name: "dana", dataType: "numeric" },
    ]),
    rows: vi.fn().mockResolvedValue([
      {
        r_id_sdm: idSdm,
        r_payload: { secret: "raw" },
        r_fetched_at: new Date("2026-09-29T04:00:00Z"),
        id: "p-1",
        tanggal: new Date("2024-01-02T00:00:00Z"),
        dana: new Prisma.Decimal("1500000.50"),
      },
    ]),
    count: vi.fn().mockResolvedValue(1),
    countByEndpointForSdm: vi.fn().mockResolvedValue([{ endpoint: "/penelitian", count: 3 }]),
    syncRuns: vi.fn().mockResolvedValue([]),
    countSyncRuns: vi.fn().mockResolvedValue(0),
    failingScopes: vi.fn().mockResolvedValue([]),
    countFailingScopeGroups: vi.fn().mockResolvedValue(0),
    ...overrides,
  };
}

describe("replika service", () => {
  it("lists modules with per-SDM counts and their replica views", async () => {
    const modules = await listReplikaModules({ id_sdm: idSdm }, fakeRepository());
    expect(modules.find((module) => module.key === "penelitian")).toMatchObject({
      view: "replica.penelitian_list",
      count: 3,
      has_item: true,
    });
    expect(modules.find((module) => module.key === "ref_agama")?.count).toBeNull();
    const withoutSdm = await listReplikaModules({}, fakeRepository());
    expect(withoutSdm.find((module) => module.key === "penelitian")?.count).toBeNull();
  });

  it("reads SDM rows, puts data columns first, hides raw payload, and makes values JSON-safe", async () => {
    const repository = fakeRepository();
    const result = await getReplikaRows({ module: "penelitian", id_sdm: idSdm }, repository);

    expect(repository.rows).toHaveBeenCalledWith("penelitian_list", { integrationId, idSdm, scopeKey: undefined }, 25, 0);
    expect(result).toMatchObject({ total: 1, page: 1, per_page: 25, truncated: false });
    expect(Object.keys(result.data[0])).toEqual(["id", "tanggal", "dana", "r_id_sdm", "r_fetched_at"]);
    expect(result.data[0]).toMatchObject({ tanggal: "2024-01-02", dana: 1500000.5 });
    expect(result.fetched_at).toBe("2026-09-29T04:00:00.000Z");
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("filters referensi variants by the sync scope key", async () => {
    const repository = fakeRepository();
    await getReplikaRows({ module: "ref_wilayah_1" }, repository);
    expect(repository.rows).toHaveBeenCalledWith(
      "referensi_wilayah",
      { integrationId, idSdm: undefined, scopeKey: "id_level_wilayah=1" },
      25, 0,
    );
  });

  it("can read beyond the old 5000-row cap using bounded pages", async () => {
    const repository = fakeRepository({ count: vi.fn().mockResolvedValue(43339) });
    const result = await getReplikaRows({ module: "ref_wilayah_1", page: 2167, per_page: 20 }, repository);
    expect(repository.rows).toHaveBeenCalledWith("referensi_wilayah", { integrationId, idSdm: undefined, scopeKey: "id_level_wilayah=1" }, 20, 43320);
    expect(result).toMatchObject({ total: 43339, page: 2167, per_page: 20, truncated: false });
  });

  it("requires an SDM and an existing view", async () => {
    await expect(getReplikaRows({ module: "penelitian" }, fakeRepository())).rejects.toBeInstanceOf(
      ReplikaUnavailableError,
    );
    await expect(
      getReplikaRows({ module: "tunjangan", id_sdm: idSdm }, fakeRepository()),
    ).rejects.toThrow("replica:views");
  });

  it("collects detail, array child views, and bidang ilmu for an item", async () => {
    const repository = fakeRepository();
    const item = await getReplikaItem({ module: "penelitian", id: "p-1" }, repository);

    expect(item.sections.map((section) => section.key)).toEqual(["detail", "penelitian_anggota", "bidang_ilmu"]);
    expect(repository.rows).toHaveBeenCalledWith("penelitian_anggota", { integrationId, parentId: "p-1" }, 25, 0);
  });

  it("proves list membership in the selected integration and SDM before shared detail reads", async () => {
    const repository = fakeRepository();
    await getReplikaItem({ module: "penelitian", id: "p-1", id_sdm: idSdm }, repository);
    expect(repository.rows).toHaveBeenNthCalledWith(1, "penelitian_list", { integrationId, itemKey: "p-1", idSdm }, 1, 0);
    expect(repository.rows).toHaveBeenNthCalledWith(2, "penelitian", { integrationId, parentId: "p-1" }, 1, 0);
  });

  it("does not read details or children for a missing, retired or foreign parent", async () => {
    const repository = fakeRepository({ rows: vi.fn().mockResolvedValue([]) });
    await expect(getReplikaItem({ module: "penelitian", id: "unknown" }, repository)).rejects.toBeInstanceOf(SisterNotFoundError);
    expect(repository.rows).toHaveBeenCalledExactlyOnceWith("penelitian_list", { integrationId, itemKey: "unknown" }, 1, 0);
  });

  it("does not let a selected SDM read another SDM's parent item", async () => {
    const rows = vi.fn().mockImplementation(async (view: string, filter: { idSdm?: string }) =>
      view === "penelitian_list" && filter.idSdm !== idSdm ? [] : [{ id: "p-1" }],
    );
    const repository = fakeRepository({ rows });
    const otherSdm = "00000000-0000-4000-8000-000000000002";
    await expect(getReplikaItem({ module: "penelitian", id: "p-1", id_sdm: otherSdm }, repository)).rejects.toBeInstanceOf(SisterNotFoundError);
    expect(rows).toHaveBeenCalledExactlyOnceWith("penelitian_list", { integrationId, itemKey: "p-1", idSdm: otherSdm }, 1, 0);
  });

  it("keeps reference variant scope filters on parent membership queries", async () => {
    const repository = fakeRepository();
    await getReplikaItem({ module: "ref_wilayah_1", id: "region" }, repository);
    expect(repository.rows).toHaveBeenCalledExactlyOnceWith("referensi_wilayah", { integrationId, itemKey: "region", scopeKey: "id_level_wilayah=1" }, 1, 0);
  });

  it("resolves class relationships only from the stored parent when detail is missing", async () => {
    const rows = vi.fn().mockImplementation(async (view: string) =>
      view === "pengajaran_list" ? [{ id: "ajaran", id_kelas: "stored-class" }] : [],
    );
    const repository = fakeRepository({
      listViews: vi.fn().mockResolvedValue([
        { name: "pengajaran_list", comment: null },
        { name: "pengajaran", comment: null },
        { name: "pengajaran_bidang_ilmu", comment: null },
        { name: "kelas_kuliah_dokumen", comment: null },
      ]),
      columns: vi.fn().mockResolvedValue([{ name: "id", dataType: "text" }, { name: "id_kelas", dataType: "text" }]),
      rows,
    });
    const input = replikaItemInputSchema.parse({ module: "pengajaran", id: "ajaran", source_value: "forged-class" });
    expect(input).not.toHaveProperty("source_value");
    await getReplikaItem(input, repository);
    expect(rows).toHaveBeenCalledWith("kelas_kuliah_dokumen", { integrationId, parentId: "stored-class" }, 25, 0);
    expect(JSON.stringify(rows.mock.calls)).not.toContain("forged-class");
  });

  it("does not request class documents when no stored relation ID exists", async () => {
    const repository = fakeRepository({
      listViews: vi.fn().mockResolvedValue([
        { name: "pengajaran_list", comment: null },
        { name: "pengajaran", comment: null },
        { name: "pengajaran_bidang_ilmu", comment: null },
      ]),
    });
    const item = await getReplikaItem({ module: "pengajaran", id: "ajaran" }, repository);
    expect(item.sections.map((section) => section.key)).not.toContain("kelas_dokumen");
  });

  it("rejects live-only search modules before any replica lookup", async () => {
    const repository = fakeRepository();
    await expect(getReplikaItem({ module: "kolaborator_eksternal", id: "unknown" }, repository)).rejects.toBeInstanceOf(ReplikaUnavailableError);
    expect(repository.listViews).not.toHaveBeenCalled();
  });

  it("labels sync runs by target", async () => {
    const status = await getReplikaSyncStatus(
      undefined,
      fakeRepository({
        syncRuns: vi.fn().mockResolvedValue([
          {
            id: "run-1",
            scope: "full",
            status: "PARTIAL",
            baseUrl: "https://sister-api.kemdiktisaintek.go.id/ws-sandbox.php/1.0/",
            requestCount: 10,
            recordCount: 5,
            changedCount: 5,
            deletedCount: 0,
            errorCount: 1,
            startedAt: new Date("2026-09-29T04:00:00Z"),
            finishedAt: null,
            heartbeatAt: new Date("2026-09-29T04:10:00Z"),
          },
        ]),
      }),
    );
    expect(status.runs[0]).toMatchObject({
      target: "sandbox",
      finished_at: null,
      heartbeat_at: "2026-09-29T04:10:00.000Z",
    });
  });

  it("pages run history and status groups independently with tenant-scoped totals", async () => {
    const repository = fakeRepository({
      countSyncRuns: vi.fn().mockResolvedValue(83),
      countFailingScopeGroups: vi.fn().mockResolvedValue(53),
    });
    const status = await getReplikaSyncStatus({ run_page: 4, scope_page: 2, per_page: 10 }, repository);
    expect(repository.syncRuns).toHaveBeenCalledExactlyOnceWith(10, integrationId, 30);
    expect(repository.failingScopes).toHaveBeenCalledExactlyOnceWith(10, integrationId, 10);
    expect(repository.countSyncRuns).toHaveBeenCalledExactlyOnceWith(integrationId);
    expect(repository.countFailingScopeGroups).toHaveBeenCalledExactlyOnceWith(integrationId);
    expect(status).toMatchObject({ run_total: 83, scope_group_total: 53, run_page: 4, scope_page: 2, per_page: 10 });
  });

  it("defaults omitted sync status input and rejects unbounded pages", () => {
    expect(replikaSyncStatusInputSchema.parse(undefined)).toEqual({ run_page: 1, scope_page: 1, per_page: 20 });
    expect(replikaSyncStatusInputSchema.parse({})).toEqual({ run_page: 1, scope_page: 1, per_page: 20 });
    expect(replikaSyncStatusInputSchema.safeParse({ run_page: 0 }).success).toBe(false);
    expect(replikaSyncStatusInputSchema.safeParse({ scope_page: 1.5 }).success).toBe(false);
    expect(replikaSyncStatusInputSchema.safeParse({ per_page: 101 }).success).toBe(false);
  });

  it("reads coverage only for the configured integration and exposes aggregates", async () => {
    const repository = fakeRepository();
    const result = await getReplikaCoverage(repository);
    expect(repository.coverageCounts).toHaveBeenCalledWith(integrationId);
    expect(result.summary.templates).toBe(135);
    expect(result.summary.active_records).toBe(0);
    expect(result.checked_at).toEqual(expect.any(String));
  });

  it("converts driver values", () => {
    expect(toJsonSafe(BigInt(5))).toBe(5);
    expect(toJsonSafe(BigInt("90071992547409930"))).toBe("90071992547409930");
    expect(toJsonSafe(new Date("2024-01-02T00:00:00Z"), "date")).toBe("2024-01-02");
  });
});

describe("replika router", () => {
  function caller(role: "ADMIN" | "OPERATOR" | "REVIEWER" | "VIEWER" | null) {
    return appRouter.createCaller({
      requestId: "replika-request",
      request: new Request("https://app.test/api/trpc/replika.sync_status"),
      user: role ? { id: "00000000-0000-4000-8000-000000000001", email: "u@example.test", name: "U", role } : null,
    });
  }

  it("guards coverage before querying storage and sanitizes failures", async () => {
    const query = vi.spyOn(PrismaReplikaRepository.prototype, "coverageCounts").mockResolvedValue({ records: [], scopes: [] });
    try {
      await expect(caller(null).replika.coverage()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      for (const role of ["VIEWER", "REVIEWER"] as const) {
        await expect(caller(role).replika.coverage()).rejects.toMatchObject({ code: "FORBIDDEN" });
      }
      expect(query).not.toHaveBeenCalled();
      for (const role of ["ADMIN", "OPERATOR"] as const) {
        expect((await caller(role).replika.coverage()).summary.templates).toBe(135);
      }
      query.mockRejectedValueOnce(new Error("private database detail"));
      await expect(caller("ADMIN").replika.coverage()).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR", message: "Data replika gagal dibaca" });
    } finally { query.mockRestore(); }
  });

  it("limits sync status to operators and validates module keys", async () => {
    await expect(caller("VIEWER").replika.sync_status()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller("VIEWER").replika.rows({ module: "../x" as "ref_agama" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller("OPERATOR").replika.rows({ module: "../x" as "ref_agama" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
