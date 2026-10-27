// Read-only progress report. Never prints credentials, scope IDs or payloads.
// bun run sister:coverage
import { prisma } from "@/server/db/prisma";
import { getSisterConfig } from "@/server/sister/config";
import { replicaEndpointTemplates, sdmListEndpoints } from "@/server/sister/replica/replica_catalog";

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
  const counts = new Map(records.map((row) => [row.endpoint, row._count]));
  const parentLists = new Map(sdmListEndpoints.flatMap((list) =>
    (list.children ?? []).map((child) => [child.path, list.path] as const),
  ));
  const endpoints = replicaEndpointTemplates().map((endpoint) => {
    const groups = scopes.filter((row) => row.endpoint === endpoint);
    const count = counts.get(endpoint) ?? 0;
    const failed = groups.some((row) => row.lastStatus !== 200 && row.lastStatus !== 404);
    const parent = parentLists.get(endpoint);
    const parentEmpty = parent && !counts.get(parent) && scopes.some((row) => row.endpoint === parent && row.lastStatus === 200);
    return {
      endpoint,
      state: groups.length === 0 ? parentEmpty ? "waiting_for_parent" : "never_fetched"
        : failed ? "partial_or_failed" : count ? "available"
        : groups.some((row) => row.lastStatus === 404) ? "not_found" : "empty",
      records: count,
      scopes: groups.reduce((sum, row) => sum + row._count, 0),
      statuses: Object.fromEntries(groups.map((row) => [row.lastStatus, row._count])),
      last_checked_at: groups.map((row) => row._max.lastFetchedAt).filter((date) => date !== null)
        .sort((left, right) => right.getTime() - left.getTime())[0]?.toISOString() ?? null,
    };
  });
  console.log(JSON.stringify({
    checked_at: new Date().toISOString(),
    target: config.fixture_mode ? "fixture" : config.base_url?.includes("sandbox") ? "sandbox" : "production",
    summary: {
      templates: endpoints.length,
      active_records: records.reduce((sum, row) => sum + row._count, 0),
      templates_with_records: records.length,
      templates_with_scopes: new Set(scopes.map((row) => row.endpoint)).size,
      states: Object.fromEntries([...new Set(endpoints.map((row) => row.state))]
        .map((state) => [state, endpoints.filter((row) => row.state === state).length])),
      // These five GETs must be verified separately, never treated as bulk sync.
      live_only_gets: 5,
    },
    latest_run: latestRun,
    latest_full_run: latestFullRun,
    endpoints,
  }, null, 2));
} catch {
  console.error("Coverage report failed. Check local database and SISTER configuration; no credentials or payloads were printed.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
