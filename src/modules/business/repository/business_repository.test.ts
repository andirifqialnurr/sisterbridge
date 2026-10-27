import type { PrismaClient } from "@prisma/client";
import { expect, it, vi } from "vitest";
import { PrismaBusinessRepository } from "./business_repository";

it("applies the same bound unit-kind filter before pagination and count", async () => {
  const query = vi.fn().mockResolvedValue([]);
  const client = { $queryRawUnsafe: query } as unknown as Pick<PrismaClient, "$queryRawUnsafe">;
  const repository = new PrismaBusinessRepository(client);
  const filter = { integrationId: "integration", scopeKey: "own-pt", unitKind: "3" };
  await repository.rows("referensi_unit_kerja", filter, 20, 20);
  expect(query).toHaveBeenLastCalledWith(expect.stringContaining("r_integration_id = $1::uuid AND r_scope_key = $2 AND r_payload->>'id_jenis_unit' = $3"), "integration", "own-pt", "3", 20, 20);
  query.mockResolvedValueOnce([{ count: BigInt(5) }]);
  expect(await repository.count("referensi_unit_kerja", filter)).toBe(5);
  expect(query).toHaveBeenLastCalledWith(expect.stringContaining("r_payload->>'id_jenis_unit' = $3"), "integration", "own-pt", "3");
});
