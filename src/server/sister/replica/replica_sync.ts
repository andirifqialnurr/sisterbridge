import { createHash } from "node:crypto";

import type { SisterSyncStatus } from "@prisma/client";

import {
  bkdActivityEndpoints,
  detailUnitKerjaEndpoint,
  referensiEnumEndpoints,
  referensiSimpleEndpoints,
  replicaPageSize,
  sdmListEndpoint,
  sdmListEndpoints,
  sdmPathEndpoints,
  unitKerjaEndpoint,
  type ReplicaListEndpoint,
} from "./replica_catalog";
import type { ReplicaFetcher, ReplicaFetchResult } from "./replica_fetch";
import { RateGate, RateLimitExhaustedError } from "./replica_rate_gate";
import type { ReplicaItem, ReplicaScope, ReplicaStore } from "./replica_repository";

export type ReplicaSyncScope = "full" | "referensi" | "sdm";

export type ReplicaSyncOptions = {
  integrationId: string;
  baseUrl: string;
  credentialRef: string;
  scope: ReplicaSyncScope;
  // Restrict the per-SDM phase to these IDs (from `/referensi/sdm`).
  sdmIds?: string[];
  // Only sync the first N SDMs; meant for smoke tests.
  sdmLimit?: number;
  concurrency: number;
  // Upper bound on request starts per second (default 4). Lowered
  // automatically while SISTER answers 429.
  requestsPerSecond?: number;
  includeChildren: boolean;
  // Re-fetch every child (detail, bidang_ilmu) even when its parent list row
  // is unchanged. Without it only new/changed parents and never-fetched
  // children are requested.
  refreshChildren?: boolean;
  log?: (line: string) => void;
};

export type ReplicaSyncDeps = {
  fetcher: ReplicaFetcher;
  store: ReplicaStore;
  authorize: () => Promise<{ role: string }>;
  // Injectable for tests; defaults to a gate at options.requestsPerSecond.
  rateGate?: RateGate;
  heartbeatMs?: number;
};

type EndpointStats = {
  requests: number;
  failed: number;
  skipped: number;
  records: number;
  created: number;
  changed: number;
  deleted: number;
  statuses: Record<string, number>;
  shapes: Record<string, number>;
};

type ErrorSample = {
  endpoint: string;
  scope: string;
  status: number;
  code: string;
  message: string;
};

export type ReplicaSyncResult = {
  runId: string | null;
  status: SisterSyncStatus;
  requestCount: number;
  recordCount: number;
  changedCount: number;
  deletedCount: number;
  errorCount: number;
  endpoints: Record<string, EndpointStats>;
  errors: ErrorSample[];
};

const maxErrorSamples = 100;
const maxPages = 200;

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function hashPayload(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function idOf(item: unknown): string | null {
  if (!isRecord(item)) {
    return null;
  }
  for (const field of ["id", "id_sdm"]) {
    const value = item[field];
    if ((typeof value === "string" && value.length > 0) || typeof value === "number") {
      return String(value);
    }
  }
  return null;
}

// Several endpoints documented as arrays actually answer with a bare object
// (`/referensi/profil_pt`) or `{}` (`/referensi/perguruan_tinggi`). The replica
// stores what SISTER returns and records the shape in the run stats.
export function toItems(payload: unknown): { items: unknown[]; shape: string } {
  if (Array.isArray(payload)) {
    return { items: payload, shape: "array" };
  }
  if (isRecord(payload)) {
    return Object.keys(payload).length === 0
      ? { items: [], shape: "empty_object" }
      : { items: [payload], shape: "object" };
  }
  return { items: payload === null || payload === undefined ? [] : [payload], shape: typeof payload };
}

export function toReplicaItems(items: unknown[], kind: "list" | "object"): ReplicaItem[] {
  const byKey = new Map<string, ReplicaItem>();

  for (const item of items) {
    const hash = hashPayload(item);
    const itemKey =
      kind === "object" && items.length === 1 ? "self" : (idOf(item) ?? `h:${hash.slice(0, 40)}`);
    byKey.set(itemKey, { itemKey, payload: item, hash });
  }

  return [...byKey.values()];
}

function scopeKeyOf(query: Record<string, string> | undefined) {
  const entries = Object.entries(query ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return entries.length === 0 ? "-" : new URLSearchParams(entries).toString();
}

class Limiter {
  private active = 0;
  private readonly queue: (() => void)[] = [];

  constructor(private readonly size: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.size) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active += 1;
    try {
      return await task();
    } finally {
      this.active -= 1;
      this.queue.shift()?.();
    }
  }
}

export async function runReplicaSync(
  deps: ReplicaSyncDeps,
  options: ReplicaSyncOptions,
): Promise<ReplicaSyncResult> {
  const log = options.log ?? (() => {});
  const limiter = new Limiter(Math.max(1, options.concurrency));
  const gate = deps.rateGate ?? new RateGate({ requestsPerSecond: options.requestsPerSecond ?? 4 });
  let rateLimitAbort: RateLimitExhaustedError | null = null;

  // Paces every request through the shared gate and repeats a request that
  // SISTER refused with 429 after the gate's cooldown. Once the gate gives
  // up, every pending and later request fails fast so the run stops.
  async function pacedFetch(path: string, query?: Record<string, string>): Promise<ReplicaFetchResult> {
    for (;;) {
      if (rateLimitAbort) {
        throw rateLimitAbort;
      }
      const response = await limiter.run(async () => {
        await gate.acquire();
        if (rateLimitAbort) {
          throw rateLimitAbort;
        }
        return deps.fetcher(path, query);
      });
      if (response.ok || response.status !== 429) {
        if (response.ok) {
          gate.recordSuccess();
        }
        return response;
      }
      try {
        const pauseMs = gate.recordRateLimit();
        log(`429 from SISTER; pausing ${Math.round(pauseMs / 1000)}s, rate now ${gate.currentRps.toFixed(2)} req/s`);
      } catch (error) {
        rateLimitAbort ??= error as RateLimitExhaustedError;
        throw rateLimitAbort;
      }
    }
  }
  const endpoints: Record<string, EndpointStats> = {};
  const errors: ErrorSample[] = [];
  const totals = { requests: 0, records: 0, changed: 0, deleted: 0, errors: 0 };

  function statsFor(endpoint: string) {
    endpoints[endpoint] ??= {
      requests: 0,
      failed: 0,
      skipped: 0,
      records: 0,
      created: 0,
      changed: 0,
      deleted: 0,
      statuses: {},
      shapes: {},
    };
    return endpoints[endpoint];
  }

  const result = (runId: string | null, status: SisterSyncStatus): ReplicaSyncResult => ({
    runId,
    status,
    requestCount: totals.requests,
    recordCount: totals.records,
    changedCount: totals.changed,
    deletedCount: totals.deleted,
    errorCount: totals.errors,
    endpoints,
    errors,
  });

  let role: string | null = null;
  let authorizeError: string | null = null;
  try {
    role = (await deps.authorize()).role;
  } catch (error) {
    authorizeError = error instanceof Error ? error.name : "Error";
  }

  await deps.store.ensureIntegration({
    integrationId: options.integrationId,
    baseUrl: options.baseUrl,
    credentialRef: options.credentialRef,
    expectedRole: role,
  });
  const runId = await deps.store.startRun({
    integrationId: options.integrationId,
    baseUrl: options.baseUrl,
    scope:
      options.sdmIds?.length || options.sdmLimit
        ? `${options.scope}:partial_sdm`
        : options.scope,
  });

  if (authorizeError) {
    totals.errors += 1;
    errors.push({ endpoint: "/authorize", scope: "-", status: 0, code: "AUTHORIZE", message: authorizeError });
    const failed = result(runId, "FAILED");
    await deps.store.finishRun(runId, {
      status: "FAILED",
      requestCount: 0,
      recordCount: 0,
      changedCount: 0,
      deletedCount: 0,
      errorCount: 1,
      stats: { endpoints, errors, rate_limited: gate.rateLimitCount },
    });
    return failed;
  }
  log(`authorized as ${role}; run ${runId}`);

  // Fetches one scope (all pages), stores it, and returns the raw items, or
  // null when SISTER failed so callers skip dependent requests.
  async function syncScope(input: {
    endpoint: string;
    path: string;
    query?: Record<string, string>;
    kind: "list" | "object";
    paginated?: boolean;
    idSdm: string | null;
    parentId: string | null;
  }): Promise<{ items: unknown[]; changedKeys: string[] } | null> {
    const stats = statsFor(input.endpoint);
    // Path-parameter endpoints have no query, so their scope is the ID that
    // was substituted into the path.
    const scopeQuery =
      input.query ??
      (input.parentId
        ? { id: input.parentId }
        : input.endpoint.includes("{id_sdm}") && input.idSdm
          ? { id_sdm: input.idSdm }
          : undefined);
    const scope: ReplicaScope = {
      endpoint: input.endpoint,
      scopeKey: scopeKeyOf(scopeQuery),
      idSdm: input.idSdm,
      parentId: input.parentId,
    };

    const collected: unknown[] = [];
    for (let page = 1; page <= maxPages; page += 1) {
      const query = input.paginated
        ? { ...input.query, per_page: String(replicaPageSize), page: String(page) }
        : input.query;
      const response = await pacedFetch(input.path, query);
      totals.requests += 1;
      stats.requests += 1;

      const statusKey = response.ok ? "200" : String(response.status);
      stats.statuses[statusKey] = (stats.statuses[statusKey] ?? 0) + 1;

      if (!response.ok) {
        // 404 is SISTER's answer for "no data" on single-object endpoints;
        // treat it as an empty but complete scope so stale rows get retired.
        if (response.status === 404) {
          break;
        }
        stats.failed += 1;
        totals.errors += 1;
        await deps.store.recordScopeFailure(runId!, options.integrationId, scope, {
          status: response.status,
          code: response.code,
        });
        if (errors.length < maxErrorSamples) {
          errors.push({
            endpoint: input.endpoint,
            scope: scope.scopeKey,
            status: response.status,
            code: response.code,
            message: response.message,
          });
        }
        return null;
      }

      const { items, shape } = toItems(response.payload);
      stats.shapes[shape] = (stats.shapes[shape] ?? 0) + 1;
      collected.push(...items);
      if (!input.paginated || items.length < replicaPageSize) {
        break;
      }
    }

    const replicaItems = toReplicaItems(collected, input.kind);
    const saved = await deps.store.saveScope(runId!, options.integrationId, scope, replicaItems);
    stats.records += replicaItems.length;
    stats.created += saved.created;
    stats.changed += saved.changed;
    stats.deleted += saved.deleted;
    totals.records += replicaItems.length;
    totals.changed += saved.created + saved.changed;
    totals.deleted += saved.deleted;
    return { items: collected, changedKeys: saved.changedKeys };
  }

  async function syncListWithChildren(
    definition: ReplicaListEndpoint,
    query: Record<string, string> | undefined,
    idSdm: string | null,
  ) {
    const fetched = await syncScope({
      endpoint: definition.path,
      path: definition.path,
      query,
      kind: "list",
      paginated: definition.paginated,
      idSdm,
      parentId: null,
    });
    if (!fetched || !options.includeChildren || !definition.children) {
      return fetched?.items ?? null;
    }

    const ids = [...new Set(fetched.items.map(idOf).filter((id): id is string => id !== null))];
    const changed = new Set(fetched.changedKeys);
    await Promise.all(
      definition.children.map(async (child) => {
        let targets = ids;
        if (!options.refreshChildren) {
          const alreadyFetched = await deps.store.fetchedScopeKeys(
            options.integrationId,
            child.path,
            ids.map((id) => scopeKeyOf({ id })),
          );
          targets = ids.filter((id) => changed.has(id) || !alreadyFetched.has(scopeKeyOf({ id })));
          statsFor(child.path).skipped += ids.length - targets.length;
        }

        await Promise.all(
          targets.map(async (id) => {
            const detail = await syncScope({
              endpoint: child.path,
              path: child.path.replace("{id}", encodeURIComponent(id)),
              kind: child.path.endsWith("/bidang_ilmu") ? "list" : "object",
              idSdm,
              parentId: id,
            });
            const follow = child.follow;
            const payload = detail?.items[0];
            if (!follow || !isRecord(payload)) {
              return;
            }
            const followId = payload[follow.field];
            if (follow.ownPtField && ownPtId && payload[follow.ownPtField] !== ownPtId) {
              statsFor(follow.path).skipped += 1;
              return;
            }
            if (typeof followId === "string" && followId.length > 0) {
              await syncScope({
                endpoint: follow.path,
                path: follow.path.replace("{id}", encodeURIComponent(followId)),
                kind: "list",
                idSdm,
                parentId: followId,
              });
            }
          }),
        );
      }),
    );
    return fetched.items;
  }

  // The PT that owns the credential; fetched first in every scope because
  // unit_kerja and the kelas kuliah follow depend on it.
  let ownPtId: string | null = null;

  async function syncProfilPt() {
    const profilPt = await syncScope({
      endpoint: "/referensi/profil_pt",
      path: "/referensi/profil_pt",
      kind: "object",
      idSdm: null,
      parentId: null,
    });
    ownPtId =
      profilPt?.items
        .map((item) => (isRecord(item) ? item.id_perguruan_tinggi ?? item.id : null))
        .find((value): value is string => typeof value === "string" && value.length > 0) ?? null;
  }

  async function syncReferensi() {
    const simple = referensiSimpleEndpoints.filter((endpoint) => endpoint.path !== "/referensi/profil_pt");
    await Promise.all([
      ...simple.map((endpoint) => syncListWithChildren(endpoint, endpoint.query, null)),
      ...referensiEnumEndpoints.map((endpoint) => syncListWithChildren(endpoint, endpoint.query, null)),
    ]);

    const idPerguruanTinggi = ownPtId;
    if (!idPerguruanTinggi) {
      log("profil_pt has no id_perguruan_tinggi; skipping unit_kerja");
      return;
    }

    const units = await syncScope({
      endpoint: unitKerjaEndpoint,
      path: unitKerjaEndpoint,
      query: { id_perguruan_tinggi: idPerguruanTinggi },
      kind: "list",
      idSdm: null,
      parentId: null,
    });
    const unitIds = [...new Set((units?.items ?? []).map(idOf).filter((id): id is string => id !== null))];
    await Promise.all(
      unitIds.map((idUnitKerja) =>
        syncScope({
          endpoint: detailUnitKerjaEndpoint,
          path: detailUnitKerjaEndpoint,
          query: { id_unit_kerja: idUnitKerja },
          kind: "list",
          idSdm: null,
          parentId: idUnitKerja,
        }),
      ),
    );
  }

  async function syncSdm(idSdm: string) {
    const encoded = encodeURIComponent(idSdm);
    await Promise.all([
      ...sdmPathEndpoints.map((endpoint) =>
        syncScope({
          endpoint,
          path: endpoint.replace("{id_sdm}", encoded),
          kind: endpoint.endsWith("/bidang_ilmu/{id_sdm}") ? "list" : "object",
          idSdm,
          parentId: null,
        }),
      ),
      ...sdmListEndpoints.map(async (definition) => {
        const items = await syncListWithChildren(definition, { id_sdm: idSdm }, idSdm);
        if (definition.path !== "/bkd/laporan_akhir_bkd" || !items) {
          return;
        }
        const semesters = [
          ...new Set(
            items
              .map((item) => (isRecord(item) ? item.id_smt : null))
              .filter((value): value is string => typeof value === "string" && value.length > 0),
          ),
        ];
        await Promise.all(
          semesters.flatMap((idSmt) =>
            bkdActivityEndpoints.map((endpoint) =>
              syncScope({
                endpoint,
                path: endpoint,
                query: { id_sdm: idSdm, id_smt: idSmt },
                kind: "list",
                idSdm,
                parentId: null,
              }),
            ),
          ),
        );
      }),
    ]);
  }

  // Counters and heartbeat_at are persisted periodically so the status page
  // shows progress and a crashed process can be told apart from a live one.
  const heartbeat = setInterval(() => {
    void deps.store
      .heartbeat(runId, {
        requestCount: totals.requests,
        recordCount: totals.records,
        changedCount: totals.changed,
        deletedCount: totals.deleted,
        errorCount: totals.errors,
      })
      .catch(() => {});
  }, deps.heartbeatMs ?? 30_000);
  heartbeat.unref?.();

  try {
    await syncProfilPt();
    if (options.scope === "full" || options.scope === "referensi") {
      log("syncing referensi ...");
      await syncReferensi();
      log(`referensi done: ${totals.requests} requests, ${totals.errors} errors`);
    }

    if (options.scope === "full" || options.scope === "sdm" || options.scope === "referensi") {
      const sdmItems = await syncScope({
        endpoint: sdmListEndpoint,
        path: sdmListEndpoint,
        kind: "list",
        idSdm: null,
        parentId: null,
      });

      if (options.scope !== "referensi") {
        let sdmIds = (sdmItems?.items ?? []).map(idOf).filter((id): id is string => id !== null);
        if (options.sdmIds?.length) {
          const wanted = new Set(options.sdmIds);
          sdmIds = sdmIds.filter((id) => wanted.has(id));
        }
        if (options.sdmLimit && options.sdmLimit > 0) {
          sdmIds = sdmIds.slice(0, options.sdmLimit);
        }

        let done = 0;
        // SDMs are processed a few at a time; the shared limiter still caps
        // the number of in-flight requests to SISTER.
        const sdmLimiter = new Limiter(Math.max(1, Math.ceil(options.concurrency / 2)));
        await Promise.all(
          sdmIds.map((idSdm) =>
            sdmLimiter.run(async () => {
              await syncSdm(idSdm);
              done += 1;
              log(`sdm ${done}/${sdmIds.length} done: ${totals.requests} requests, ${totals.errors} errors`);
            }),
          ),
        );
      }
    }
  } catch (error) {
    clearInterval(heartbeat);
    totals.errors += 1;
    errors.push({
      endpoint: "-",
      scope: "-",
      status: 0,
      code: "SYNC_ABORTED",
      message: error instanceof Error ? `${error.name}: ${error.message}`.slice(0, 200) : "Error",
    });
    const aborted = result(runId, "FAILED");
    await deps.store.finishRun(runId, {
      status: "FAILED",
      requestCount: totals.requests,
      recordCount: totals.records,
      changedCount: totals.changed,
      deletedCount: totals.deleted,
      errorCount: totals.errors,
      stats: { endpoints, errors, rate_limited: gate.rateLimitCount },
    });
    return aborted;
  }

  clearInterval(heartbeat);
  const status: SisterSyncStatus = totals.errors > 0 ? "PARTIAL" : "SUCCEEDED";
  await deps.store.finishRun(runId, {
    status,
    requestCount: totals.requests,
    recordCount: totals.records,
    changedCount: totals.changed,
    deletedCount: totals.deleted,
    errorCount: totals.errors,
    stats: { endpoints, errors, rate_limited: gate.rateLimitCount },
  });
  return result(runId, status);
}
