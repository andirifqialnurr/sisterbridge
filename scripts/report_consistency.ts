// Read-only aggregate/drill-down audit of the configured local replica.
// Checks all report groups and first/last pages; never prints record IDs,
// names, personal payloads or credentials. No upstream requests or DB writes.
import { prisma } from "@/server/db/prisma";
import { getSisterConfig } from "@/server/sister/config";
import { PrismaBusinessReportingRepository } from "@/modules/business/repository/business_reporting_repository";

const perPage = 50;
const issues: { report: string; group: string | number; reason: string }[] = [];
let checked = 0;
let pages = 0;
let sharedGroups = 0;

try {
  const integrationId = getSisterConfig().integration_id;
  if (!integrationId) throw new Error("Integration required");
  const repository = new PrismaBusinessReportingRepository();
  const owners = new Set((await prisma.sisterReplicaRecord.findMany({
    where: { integrationId, endpoint: "/referensi/sdm", deletedAt: null }, select: { itemKey: true },
  })).map(row => row.itemKey));
  const [sdm, output, bkd] = await Promise.all([
    repository.sdmGroups(integrationId), repository.outputGroups(integrationId), repository.bkdGroups(integrationId),
  ]);
  async function check(
    report: string, group: string | number, expected: number, count: number,
    rows: (offset: number) => Promise<{ id_sdm: string | null; id?: string; owner_available?: boolean }[]>,
  ) {
    checked += 1;
    if (count !== expected) issues.push({ report, group, reason: "aggregate-and-drilldown-count-mismatch" });
    const offsets = count > perPage ? [0, Math.floor((count - 1) / perPage) * perPage] : [0];
    const seen = new Set<string>();
    for (const offset of offsets) {
      const data = await rows(offset);
      pages += 1;
      if (data.length !== Math.min(perPage, Math.max(0, count - offset))) issues.push({ report, group, reason: "page-row-count-mismatch" });
      for (const row of data) {
        const key = row.id ?? row.id_sdm;
        if (!key || seen.has(key)) issues.push({ report, group, reason: "duplicate-or-missing-drilldown-key" });
        if (key) seen.add(key);
        if (!row.id_sdm || !owners.has(row.id_sdm)) issues.push({ report, group, reason: "sample-owner-not-in-current-directory" });
        else if (row.owner_available === false) issues.push({ report, group, reason: "indexed-owner-marked-unavailable" });
      }
    }
  }
  for (const group of sdm) await check("sdm", "composition", group.total,
    await repository.countSdmRows(integrationId, group.jenis_sdm, group.status_aktif),
    offset => repository.sdmRows(integrationId, group.jenis_sdm, group.status_aktif, perPage, offset));
  for (const group of output) {
    if (!["publikasi", "penelitian", "pengabdian"].includes(group.module)) throw new Error("Unknown report module");
    const moduleKey = group.module as "publikasi" | "penelitian" | "pengabdian";
    if (group.participations > group.total) sharedGroups += 1;
    await check(moduleKey, group.tahun, group.total,
      await repository.countOutputRows(integrationId, moduleKey, group.tahun),
      offset => repository.outputRows(integrationId, moduleKey, group.tahun, perPage, offset));
  }
  for (const group of bkd) await check("bkd", group.id_smt, group.total,
    await repository.countBkdRows(integrationId, group.id_smt, group.simpulan),
    offset => repository.bkdRows(integrationId, group.id_smt, group.simpulan, perPage, offset));
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), source: "local-replica", databaseWrites: false,
    groups: { sdm: sdm.length, output: output.length, bkd: bkd.length }, checkedGroups: checked,
    checkedFirstLastPages: pages, outputGroupsWithSharedActivities: sharedGroups, issues,
  }, null, 2));
  if (issues.length) process.exitCode = 1;
} catch {
  console.error("Report consistency audit failed; no credentials or personal payloads printed.");
  process.exitCode = 1;
} finally { await prisma.$disconnect(); }
