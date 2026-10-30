import { replicaEndpointTemplates, sdmListEndpoints } from "./replica_catalog";

export type CoverageRecordCount = { endpoint: string; count: number };
export type CoverageScopeCount = {
  endpoint: string;
  status: number;
  count: number;
  lastFetchedAt: Date | null;
};

// Only aggregates and catalog templates leave this boundary, never scope IDs,
// credentials or payloads. Available means cached data, not exhaustive success.
export function buildReplicaCoverage(records: CoverageRecordCount[], scopes: CoverageScopeCount[]) {
  const templates = replicaEndpointTemplates();
  const known = new Set(templates);
  const counts = new Map(records.filter(row => known.has(row.endpoint)).map(row => [row.endpoint, row.count]));
  const parentLists = new Map(sdmListEndpoints.flatMap(list =>
    (list.children ?? []).map(child => [child.path, list.path] as const),
  ));
  const endpoints = templates.map(endpoint => {
    const groups = scopes.filter(row => row.endpoint === endpoint);
    const count = counts.get(endpoint) ?? 0;
    const failed = groups.some(row => row.status !== 200 && row.status !== 404);
    const parent = parentLists.get(endpoint);
    const parentEmpty = parent && !counts.get(parent) && scopes.some(row => row.endpoint === parent && row.status === 200);
    return {
      endpoint,
      state: groups.length === 0 ? parentEmpty ? "waiting_for_parent" : "never_fetched"
        : failed ? "partial_or_failed" : count ? "available"
        : groups.some(row => row.status === 404) ? "not_found" : "empty",
      records: count,
      scopes: groups.reduce((sum, row) => sum + row.count, 0),
      statuses: Object.fromEntries(groups.map(row => [row.status, row.count])),
      last_checked_at: groups.map(row => row.lastFetchedAt).filter((date): date is Date => date !== null)
        .sort((left, right) => right.getTime() - left.getTime())[0]?.toISOString() ?? null,
    };
  });
  return {
    summary: {
      templates: endpoints.length,
      active_records: endpoints.reduce((sum, row) => sum + row.records, 0),
      templates_with_records: endpoints.filter(row => row.records > 0).length,
      templates_with_scopes: endpoints.filter(row => row.scopes > 0).length,
      states: Object.fromEntries([...new Set(endpoints.map(row => row.state))]
        .map(state => [state, endpoints.filter(row => row.state === state).length])),
      live_only_gets: 5,
    },
    endpoints,
  };
}

export type ReplicaCoverage = ReturnType<typeof buildReplicaCoverage>;
