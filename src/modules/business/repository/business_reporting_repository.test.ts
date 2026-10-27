import type { PrismaClient } from "@prisma/client";
import { expect, it, vi } from "vitest";
import { PrismaBusinessReportingRepository } from "./business_reporting_repository";

type Client = Pick<PrismaClient, "$queryRawUnsafe" | "sisterSyncRun">;

it.each(["publikasi", "penelitian", "pengabdian"] as const)("deduplicates %s and prefers a currently indexed owner before paging", async moduleKey => {
  const query = vi.fn().mockResolvedValue([]);
  const repository = new PrismaBusinessReportingRepository({ $queryRawUnsafe: query } as unknown as Client);
  await repository.outputRows("integration", moduleKey, 2026, 20, 40);
  expect(query).toHaveBeenCalledWith(expect.any(String), "integration", 2026, 20, 40);
  const sql = query.mock.calls[0][0] as string;
  expect(sql).toContain("DISTINCT ON (p.id)");
  expect(sql).toContain("p.judul");
  expect(sql).toContain("s.nama_sdm");
  expect(sql).toContain("s.id_sdm IS NOT NULL AS owner_available");
  expect(sql).toContain("s.r_integration_id = p.r_integration_id");
  expect(sql).toContain("s.r_scope_key = '-'");
  expect(sql).toContain("p.id IS NOT NULL");
  expect(sql).toContain("ORDER BY p.id, (s.id_sdm IS NULL), p.r_fetched_at DESC");
  expect(sql).toContain("ORDER BY id LIMIT $3 OFFSET $4");
  expect(sql).toContain(moduleKey === "publikasi" ? "extract(year FROM p.tanggal)::int = $2" : "p.tahun_pelaksanaan::int = $2");
});

it("keeps output group counts distinct while retaining participation counts", async () => {
  const query = vi.fn().mockResolvedValue([]);
  const repository = new PrismaBusinessReportingRepository({ $queryRawUnsafe: query } as unknown as Client);
  await repository.outputGroups("integration");
  const sql = query.mock.calls[0][0] as string;
  expect(sql).toContain("count(DISTINCT id)::int AS total");
  expect(sql).toContain("count(id)::int AS participations");
  expect(sql.match(/r_integration_id = \$1::uuid/g)).toHaveLength(3);
});

it("uses the same unique-SDM unit for BKD rows and count", async () => {
  const query = vi.fn().mockResolvedValue([]);
  const repository = new PrismaBusinessReportingRepository({ $queryRawUnsafe: query } as unknown as Client);
  await repository.bkdRows("integration", "20261", "T", 20, 20);
  expect(query).toHaveBeenCalledWith(expect.stringContaining("SELECT DISTINCT ON (r_id_sdm)"), "integration", "20261", "T", 20, 20);
  const sql = query.mock.calls[0][0] as string;
  expect(sql).toContain("ORDER BY r_id_sdm, r_fetched_at DESC, r_item_key, r_scope_key");
  expect(sql).toContain("s.r_integration_id = $1::uuid");
  expect(sql).toContain("s.id_sdm::text = b.r_id_sdm");
  query.mockResolvedValueOnce([{ total: 3 }]);
  expect(await repository.countBkdRows("integration", "20261", "T")).toBe(3);
  expect(query).toHaveBeenLastCalledWith(expect.stringContaining("count(DISTINCT r_id_sdm)"), "integration", "20261", "T");
});
