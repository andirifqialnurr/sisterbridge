// Read-only progress report. Never prints credentials, scope IDs or payloads.
// bun run sister:coverage
import { prisma } from "@/server/db/prisma";
import { getSisterConfig } from "@/server/sister/config";
import { buildReplicaCoverage } from "@/server/sister/replica/replica_coverage";

try {
  const config = getSisterConfig();
  if (!config.integration_id) throw new Error("SISTER_INTEGRATION_ID is required.");
  const integrationId = config.integration_id;
  const [records, scopes, latestRun, latestFullRun] = await Promise.all([
    prisma.sisterReplicaRecord.groupBy({
      by: ["endpoint"], where: { integrationId, deletedAt: null }, _count: true,
    }),
    prisma.sisterReplicaScope.groupBy({
      by: ["endpoint", "lastStatus"], where: { integrationId }, _count: true,
      _max: { lastFetchedAt: true },
    }),
    prisma.sisterSyncRun.findFirst({
      where: { integrationId }, orderBy: { startedAt: "desc" },
      select: { id: true, scope: true, status: true, requestCount: true, recordCount: true,
        changedCount: true, errorCount: true, startedAt: true, finishedAt: true, heartbeatAt: true },
    }),
    prisma.sisterSyncRun.findFirst({
      where: { integrationId, scope: "full" }, orderBy: { startedAt: "desc" },
      select: { id: true, status: true, requestCount: true, recordCount: true, errorCount: true,
        startedAt: true, finishedAt: true },
    }),
  ]);
  const coverage = buildReplicaCoverage(
    records.map(row => ({ endpoint: row.endpoint, count: row._count })),
    scopes.map(row => ({ endpoint: row.endpoint, status: row.lastStatus, count: row._count, lastFetchedAt: row._max.lastFetchedAt })),
  );
  console.log(JSON.stringify({
    checked_at: new Date().toISOString(),
    target: config.fixture_mode ? "fixture" : config.base_url?.includes("sandbox") ? "sandbox" : "production",
    ...coverage,
    latest_run: latestRun,
    latest_full_run: latestFullRun,
  }, null, 2));
} catch {
  console.error("Coverage report failed. Check local database and SISTER configuration; no credentials or payloads were printed.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
