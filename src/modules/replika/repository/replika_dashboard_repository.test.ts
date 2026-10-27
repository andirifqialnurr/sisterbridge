import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { PrismaReplikaDashboardRepository } from "./replika_dashboard_repository";

const integrationId = "00000000-0000-4000-8000-000000000099";

describe("dashboard PostgreSQL integration filters", () => {
  it.each([
    "sdmComposition", "syncedSdmCount", "publikasiPerTahun",
    "penelitianPerTahun", "pengabdianPerTahun", "bkdPerSemester",
  ] as const)("binds %s integration ID explicitly as UUID", async (method) => {
    const query = vi.fn().mockResolvedValue([]);
    const client = { $queryRawUnsafe: query } as unknown as Pick<PrismaClient, "$queryRawUnsafe" | "sisterSyncRun">;
    await new PrismaReplikaDashboardRepository(client)[method](integrationId);
    expect(query).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("integration_id = $1::uuid"), integrationId);
    expect(query.mock.calls[0][0]).not.toContain(integrationId);
  });
});
