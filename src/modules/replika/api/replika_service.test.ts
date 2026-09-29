import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { appRouter } from "@/server/trpc/router";

import { toJsonSafe, type ReplikaRepository } from "../repository/replika_repository";
import {
  getReplikaItem,
  getReplikaRows,
  getReplikaSyncStatus,
  listReplikaModules,
  ReplikaUnavailableError,
} from "./replika_service";

const idSdm = "8fe6735c-6e28-43e7-9eb3-3ae092bbcd62";

function fakeRepository(overrides: Partial<ReplikaRepository> = {}): ReplikaRepository {
  return {
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
    countByEndpointForSdm: vi.fn().mockResolvedValue([{ endpoint: "/penelitian", count: 3 }]),
    syncRuns: vi.fn().mockResolvedValue([]),
    failingScopes: vi.fn().mockResolvedValue([]),
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
  });

  it("reads SDM rows, puts data columns first, hides raw payload, and makes values JSON-safe", async () => {
    const repository = fakeRepository();
    const result = await getReplikaRows({ module: "penelitian", id_sdm: idSdm }, repository);

    expect(repository.rows).toHaveBeenCalledWith("penelitian_list", { idSdm, scopeKey: undefined }, 5001);
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
      { idSdm: undefined, scopeKey: "id_level_wilayah=1" },
      5001,
    );
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
    expect(repository.rows).toHaveBeenCalledWith("penelitian_anggota", { parentId: "p-1" }, 5001);
  });

  it("labels sync runs by target", async () => {
    const status = await getReplikaSyncStatus(
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
          },
        ]),
      }),
    );
    expect(status.runs[0]).toMatchObject({ target: "sandbox", finished_at: null });
  });

  it("converts driver values", () => {
    expect(toJsonSafe(BigInt(5))).toBe(5);
    expect(toJsonSafe(BigInt("90071992547409930"))).toBe("90071992547409930");
    expect(toJsonSafe(new Date("2024-01-02T00:00:00Z"), "date")).toBe("2024-01-02");
  });
});

describe("replika router", () => {
  function caller(role: "OPERATOR" | "VIEWER") {
    return appRouter.createCaller({
      requestId: "replika-request",
      request: new Request("https://app.test/api/trpc/replika.sync_status"),
      user: { id: "00000000-0000-4000-8000-000000000001", email: "u@example.test", name: "U", role },
    });
  }

  it("limits sync status to operators and validates module keys", async () => {
    await expect(caller("VIEWER").replika.sync_status()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller("VIEWER").replika.rows({ module: "../x" as "ref_agama" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
