import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { PrismaReplikaRepository } from "./replika_repository";

describe("replica item membership SQL", () => {
  it("binds integration, owner and item ID before the bounded row query", async () => {
    const query = vi.fn().mockResolvedValue([]);
    const client = { $queryRawUnsafe: query } as unknown as Pick<PrismaClient, "$queryRawUnsafe">;
    const repository = new PrismaReplikaRepository(client);
    const itemKey = "untrusted' OR true --";
    await repository.rows("penelitian_list", {
      integrationId: "integration", idSdm: "sdm", itemKey,
    }, 1, 0);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("r_integration_id = $1::uuid AND r_id_sdm = $2 AND r_item_key = $3"), "integration", "sdm", itemKey, 1, 0);
    expect(query.mock.calls[0][0]).not.toContain(itemKey);
    expect(query.mock.calls[0][0]).toContain("LIMIT $4 OFFSET $5");
  });

  it("pages sync history with deterministic ordering and a required tenant filter", async () => {
    const query = vi.fn().mockResolvedValue([]);
    const client = { $queryRawUnsafe: query } as unknown as Pick<PrismaClient, "$queryRawUnsafe">;
    const repository = new PrismaReplikaRepository(client);
    await repository.syncRuns(10, "integration", 30);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("WHERE integration_id = $2::uuid"), 10, "integration", 30);
    expect(query.mock.calls[0][0]).toContain("ORDER BY started_at DESC, id DESC");
    expect(query.mock.calls[0][0]).toContain("LIMIT $1 OFFSET $3");
  });

  it("counts all failure groups and uses stable tie-breakers instead of a fixed cap", async () => {
    const query = vi.fn().mockResolvedValue([]);
    const client = { $queryRawUnsafe: query } as unknown as Pick<PrismaClient, "$queryRawUnsafe">;
    const repository = new PrismaReplikaRepository(client);
    await repository.failingScopes(10, "integration", 20);
    expect(query.mock.calls[0][0]).toContain("endpoint, last_status, last_error_code NULLS FIRST");
    expect(query.mock.calls[0][0]).toContain("LIMIT $1 OFFSET $3");
    query.mockResolvedValueOnce([{ count: BigInt(55) }]);
    expect(await repository.countFailingScopeGroups("integration")).toBe(55);
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining("GROUP BY endpoint, last_status, last_error_code"), "integration");
    query.mockResolvedValueOnce([{ count: BigInt(81) }]);
    expect(await repository.countSyncRuns("integration")).toBe(81);
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining("WHERE integration_id = $1::uuid"), "integration");
  });

  it("applies the same parameterized membership filter to counts", async () => {
    const query = vi.fn().mockResolvedValue([{ count: BigInt(2) }]);
    const client = { $queryRawUnsafe: query } as unknown as Pick<PrismaClient, "$queryRawUnsafe">;
    const repository = new PrismaReplikaRepository(client);
    expect(await repository.count("referensi_wilayah", {
      integrationId: "integration", scopeKey: "id_level_wilayah=1", itemKey: "region",
    })).toBe(2);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("r_integration_id = $1::uuid AND r_scope_key = $2 AND r_item_key = $3"), "integration", "id_level_wilayah=1", "region");
  });
});
