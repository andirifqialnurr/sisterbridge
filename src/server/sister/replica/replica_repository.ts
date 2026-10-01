import type { Prisma, PrismaClient, SisterSyncStatus } from "@prisma/client";

export type ReplicaScope = {
  endpoint: string;
  scopeKey: string;
  idSdm: string | null;
  parentId: string | null;
};

export type ReplicaItem = {
  itemKey: string;
  payload: unknown;
  hash: string;
};

export type ReplicaSaveResult = {
  created: number;
  changed: number;
  unchanged: number;
  deleted: number;
  // Item keys that are new or whose payload changed in this save.
  changedKeys: string[];
};

export type ReplicaRunSummary = {
  status: SisterSyncStatus;
  requestCount: number;
  recordCount: number;
  changedCount: number;
  deletedCount: number;
  errorCount: number;
  stats: unknown;
};

export type ReplicaRunProgress = Omit<ReplicaRunSummary, "status" | "stats">;

// Thrown by startRun when another sync still has a fresh heartbeat.
export class SyncAlreadyRunningError extends Error {
  constructor(
    public readonly runId: string,
    public readonly heartbeatAt: Date | null,
  ) {
    super(`Sync ${runId} is still running`);
    this.name = "SyncAlreadyRunningError";
  }
}

// A RUNNING run whose heartbeat is older than this is treated as crashed.
export const syncStaleAfterMs = 5 * 60 * 1000;

export type ReplicaStore = {
  ensureIntegration(input: {
    integrationId: string;
    baseUrl: string;
    credentialRef: string;
    expectedRole: string | null;
  }): Promise<void>;
  // Claims the single sync slot: fails with SyncAlreadyRunningError while
  // another run is alive, marks crashed runs FAILED, then creates the run.
  startRun(input: { integrationId: string; baseUrl: string; scope: string }): Promise<string>;
  heartbeat(runId: string, progress: ReplicaRunProgress): Promise<void>;
  finishRun(runId: string, summary: ReplicaRunSummary): Promise<void>;
  // Upserts the complete result of one scope. Rows no longer returned by
  // SISTER are soft-deleted together with the child rows that hang off them,
  // and the scope is marked as successfully fetched.
  saveScope(
    runId: string,
    integrationId: string,
    scope: ReplicaScope,
    items: ReplicaItem[],
    responseStatus?: 200 | 404,
  ): Promise<ReplicaSaveResult>;
  // Records a failed fetch without touching the rows already replicated.
  recordScopeFailure(
    runId: string,
    integrationId: string,
    scope: ReplicaScope,
    failure: { status: number; code: string },
  ): Promise<void>;
  // Returns only scope keys whose latest fetch succeeded. A scope that had a
  // previous success but later failed must be retried on the next sync.
  fetchedScopeKeys(integrationId: string, endpoint: string, scopeKeys: string[]): Promise<Set<string>>;
};

// Postgres allows 65535 bind parameters per statement; large reference scopes
// (e.g. /referensi/dudi, tens of thousands of rows) are written in batches.
const writeBatchSize = 2_000;

function chunk<T>(items: T[], size = writeBatchSize) {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

type ReplicaClient = Pick<
  PrismaClient,
  "sisterIntegration" | "sisterSyncRun" | "sisterReplicaRecord" | "sisterReplicaScope" | "$transaction" | "$executeRawUnsafe"
>;

export class PrismaReplicaStore implements ReplicaStore {
  constructor(private readonly client: ReplicaClient) {}

  async ensureIntegration(input: {
    integrationId: string;
    baseUrl: string;
    credentialRef: string;
    expectedRole: string | null;
  }) {
    await this.client.sisterIntegration.upsert({
      where: { id: input.integrationId },
      create: {
        id: input.integrationId,
        baseUrl: input.baseUrl,
        credentialRef: input.credentialRef,
        expectedRole: input.expectedRole,
        isEnabled: true,
        lastHealthAt: new Date(),
      },
      update: {
        baseUrl: input.baseUrl,
        credentialRef: input.credentialRef,
        expectedRole: input.expectedRole,
        lastHealthAt: new Date(),
      },
    });
  }

  async startRun(input: { integrationId: string; baseUrl: string; scope: string }) {
    return this.client.$transaction(async (tx) => {
      // Transaction-scoped advisory lock: only one process at a time runs
      // this check-and-insert, whatever pooled connection it lands on.
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext('sister_replica_sync'))`);
      const running = await tx.$queryRawUnsafe<{ id: string; heartbeat_at: Date | null; started_at: Date }[]>(
        `SELECT id, heartbeat_at, started_at FROM public.sister_sync_run WHERE status = 'RUNNING'`,
      );
      const staleBefore = Date.now() - syncStaleAfterMs;
      for (const run of running) {
        const lastSign = (run.heartbeat_at ?? run.started_at).getTime();
        if (lastSign > staleBefore) {
          throw new SyncAlreadyRunningError(run.id, run.heartbeat_at);
        }
        await tx.$executeRawUnsafe(
          `UPDATE public.sister_sync_run
              SET status = 'FAILED', finished_at = now(),
                  stats_json = coalesce(stats_json, '{}'::jsonb) || '{"abandoned": true}'::jsonb
            WHERE id = $1::uuid`,
          run.id,
        );
      }
      const created = await tx.sisterSyncRun.create({
        data: { integrationId: input.integrationId, baseUrl: input.baseUrl, scope: input.scope },
        select: { id: true },
      });
      await tx.$executeRawUnsafe(`UPDATE public.sister_sync_run SET heartbeat_at = now() WHERE id = $1::uuid`, created.id);
      return created.id;
    });
  }

  async heartbeat(runId: string, progress: ReplicaRunProgress) {
    await this.client.$executeRawUnsafe(
      `UPDATE public.sister_sync_run
          SET heartbeat_at = now(), request_count = $2, record_count = $3,
              changed_count = $4, deleted_count = $5, error_count = $6
        WHERE id = $1::uuid AND status = 'RUNNING'`,
      runId,
      progress.requestCount,
      progress.recordCount,
      progress.changedCount,
      progress.deletedCount,
      progress.errorCount,
    );
  }

  async finishRun(runId: string, summary: ReplicaRunSummary) {
    await this.client.sisterSyncRun.update({
      where: { id: runId },
      data: {
        status: summary.status,
        requestCount: summary.requestCount,
        recordCount: summary.recordCount,
        changedCount: summary.changedCount,
        deletedCount: summary.deletedCount,
        errorCount: summary.errorCount,
        statsJson: summary.stats as Prisma.InputJsonValue,
        finishedAt: new Date(),
      },
    });
  }

  async saveScope(
    runId: string,
    integrationId: string,
    scope: ReplicaScope,
    items: ReplicaItem[],
    responseStatus: 200 | 404 = 200,
  ): Promise<ReplicaSaveResult> {
    const scopeWhere = {
      integrationId,
      endpoint: scope.endpoint,
      scopeKey: scope.scopeKey,
    };

    return this.client.$transaction(async (tx) => {
      const existing = await tx.sisterReplicaRecord.findMany({
        where: scopeWhere,
        select: { itemKey: true, payloadHash: true, deletedAt: true },
      });
      const existingByKey = new Map(existing.map((row) => [row.itemKey, row]));
      const now = new Date();

      const created: ReplicaItem[] = [];
      const changed: ReplicaItem[] = [];
      const unchangedKeys: string[] = [];
      for (const item of items) {
        const row = existingByKey.get(item.itemKey);
        if (!row) {
          created.push(item);
        } else if (row.payloadHash !== item.hash || row.deletedAt) {
          changed.push(item);
        } else {
          unchangedKeys.push(item.itemKey);
        }
      }

      for (const batch of chunk(created)) {
        await tx.sisterReplicaRecord.createMany({
          data: batch.map((item) => ({
            ...scopeWhere,
            itemKey: item.itemKey,
            idSdm: scope.idSdm,
            parentId: scope.parentId,
            payloadJson: item.payload as Prisma.InputJsonValue,
            payloadHash: item.hash,
            firstSeenAt: now,
            changedAt: now,
            fetchedAt: now,
            lastSyncRunId: runId,
          })),
        });
      }

      for (const item of changed) {
        await tx.sisterReplicaRecord.update({
          where: {
            integrationId_endpoint_scopeKey_itemKey: { ...scopeWhere, itemKey: item.itemKey },
          },
          data: {
            idSdm: scope.idSdm,
            parentId: scope.parentId,
            payloadJson: item.payload as Prisma.InputJsonValue,
            payloadHash: item.hash,
            changedAt: now,
            fetchedAt: now,
            deletedAt: null,
            lastSyncRunId: runId,
          },
        });
      }

      for (const batch of chunk(unchangedKeys)) {
        await tx.sisterReplicaRecord.updateMany({
          where: { ...scopeWhere, itemKey: { in: batch } },
          data: { fetchedAt: now, lastSyncRunId: runId },
        });
      }

      const seenKeys = new Set(items.map((item) => item.itemKey));
      const removedKeys = existing
        .filter((row) => !row.deletedAt && !seenKeys.has(row.itemKey))
        .map((row) => row.itemKey);

      let deleted = 0;
      for (const batch of chunk(removedKeys)) {
        const removed = await tx.sisterReplicaRecord.updateMany({
          where: { ...scopeWhere, itemKey: { in: batch }, deletedAt: null },
          data: { deletedAt: now, lastSyncRunId: runId },
        });
        const orphaned = await tx.sisterReplicaRecord.updateMany({
          where: { integrationId, parentId: { in: batch }, deletedAt: null },
          data: { deletedAt: now, lastSyncRunId: runId },
        });
        deleted += removed.count + orphaned.count;
      }

      await tx.sisterReplicaScope.upsert({
        where: { integrationId_endpoint_scopeKey: scopeWhere },
        create: {
          ...scopeWhere,
          idSdm: scope.idSdm,
          itemCount: items.length,
          lastStatus: responseStatus,
          lastErrorCode: responseStatus === 404 ? "SISTER_HTTP_404" : null,
          lastFetchedAt: now,
          lastSuccessAt: responseStatus === 200 ? now : null,
          lastSyncRunId: runId,
        },
        update: {
          idSdm: scope.idSdm,
          itemCount: items.length,
          lastStatus: responseStatus,
          lastErrorCode: responseStatus === 404 ? "SISTER_HTTP_404" : null,
          lastFetchedAt: now,
          lastSuccessAt: responseStatus === 200 ? now : undefined,
          lastSyncRunId: runId,
        },
      });

      return {
        created: created.length,
        changed: changed.length,
        unchanged: unchangedKeys.length,
        deleted,
        changedKeys: [...created, ...changed].map((item) => item.itemKey),
      };
    }, { timeout: 60_000, maxWait: 30_000 });
  }

  async recordScopeFailure(
    runId: string,
    integrationId: string,
    scope: ReplicaScope,
    failure: { status: number; code: string },
  ) {
    const now = new Date();
    await this.client.sisterReplicaScope.upsert({
      where: {
        integrationId_endpoint_scopeKey: {
          integrationId,
          endpoint: scope.endpoint,
          scopeKey: scope.scopeKey,
        },
      },
      create: {
        integrationId,
        endpoint: scope.endpoint,
        scopeKey: scope.scopeKey,
        idSdm: scope.idSdm,
        lastStatus: failure.status,
        lastErrorCode: failure.code.slice(0, 64),
        lastFetchedAt: now,
        lastSyncRunId: runId,
      },
      update: {
        lastStatus: failure.status,
        lastErrorCode: failure.code.slice(0, 64),
        lastFetchedAt: now,
        lastSyncRunId: runId,
      },
    });
  }

  async fetchedScopeKeys(integrationId: string, endpoint: string, scopeKeys: string[]) {
    if (scopeKeys.length === 0) {
      return new Set<string>();
    }
    const rows = await this.client.sisterReplicaScope.findMany({
      where: {
        integrationId,
        endpoint,
        scopeKey: { in: scopeKeys },
        lastStatus: { in: [200, 404] },
      },
      select: { scopeKey: true },
    });
    return new Set(rows.map((row) => row.scopeKey));
  }
}
