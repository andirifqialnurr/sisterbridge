import { Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

export type ReplicaViewInfo = {
  name: string;
  comment: string | null;
};

export type ReplicaColumnInfo = {
  name: string;
  dataType: string;
};

export type ReplicaRowFilter = {
  integrationId?: string;
  idSdm?: string;
  parentId?: string;
  scopeKey?: string;
};

export type ReplikaRepository = {
  listViews(): Promise<ReplicaViewInfo[]>;
  columns(view: string): Promise<ReplicaColumnInfo[]>;
  rows(view: string, filter: ReplicaRowFilter, limit: number): Promise<Record<string, unknown>[]>;
  countByEndpointForSdm(idSdm: string, integrationId?: string): Promise<{ endpoint: string; count: number }[]>;
  syncRuns(limit: number, integrationId?: string): Promise<SyncRunRow[]>;
  failingScopes(limit: number, integrationId?: string): Promise<FailingScopeRow[]>;
};

export type SyncRunRow = {
  id: string;
  scope: string;
  status: string;
  baseUrl: string;
  requestCount: number;
  recordCount: number;
  changedCount: number;
  deletedCount: number;
  errorCount: number;
  startedAt: Date;
  finishedAt: Date | null;
  heartbeatAt: Date | null;
};

export type FailingScopeRow = {
  endpoint: string;
  lastStatus: number;
  lastErrorCode: string | null;
  scopes: number;
  lastFetchedAt: Date;
};

type ReplikaClient = Pick<PrismaClient, "$queryRawUnsafe">;

function quoteIdent(name: string) {
  return `"${name.replaceAll('"', '""')}"`;
}

// View names are only ever taken from listViews() (the database catalog),
// never from request input, before being interpolated as identifiers.
export class PrismaReplikaRepository implements ReplikaRepository {
  constructor(private readonly client: ReplikaClient = prisma) {}

  async listViews() {
    return this.client.$queryRawUnsafe<ReplicaViewInfo[]>(
      `SELECT c.relname AS name, obj_description(c.oid, 'pg_class') AS comment
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'replica' AND c.relkind = 'v'
        ORDER BY c.relname`,
    );
  }

  async columns(view: string) {
    return this.client.$queryRawUnsafe<ReplicaColumnInfo[]>(
      `SELECT column_name AS name, data_type AS "dataType"
         FROM information_schema.columns
        WHERE table_schema = 'replica' AND table_name = $1
        ORDER BY ordinal_position`,
      view,
    );
  }

  async rows(view: string, filter: ReplicaRowFilter, limit: number) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter.integrationId) {
      params.push(filter.integrationId);
      conditions.push(`r_integration_id = $${params.length}`);
    }
    if (filter.idSdm) {
      params.push(filter.idSdm);
      conditions.push(`r_id_sdm = $${params.length}`);
    }
    if (filter.parentId) {
      params.push(filter.parentId);
      conditions.push(`r_parent_id = $${params.length}`);
    }
    if (filter.scopeKey) {
      params.push(filter.scopeKey);
      conditions.push(`r_scope_key = $${params.length}`);
    }
    params.push(limit);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return this.client.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM replica.${quoteIdent(view)} ${where} ORDER BY r_item_key LIMIT $${params.length}`,
      ...params,
    );
  }

  async countByEndpointForSdm(idSdm: string, integrationId?: string) {
    const rows = await this.client.$queryRawUnsafe<{ endpoint: string; count: bigint }[]>(
      `SELECT endpoint, count(*) AS count FROM public.sister_replica_record
        WHERE id_sdm = $1 AND deleted_at IS NULL AND ($2::uuid IS NULL OR integration_id = $2) GROUP BY endpoint`,
      idSdm,
      integrationId ?? null,
    );
    return rows.map((row) => ({ endpoint: row.endpoint, count: Number(row.count) }));
  }

  async syncRuns(limit: number, integrationId?: string) {
    return this.client.$queryRawUnsafe<SyncRunRow[]>(
      `SELECT id, scope, status::text AS status, base_url AS "baseUrl",
              request_count AS "requestCount", record_count AS "recordCount",
              changed_count AS "changedCount", deleted_count AS "deletedCount",
              error_count AS "errorCount", started_at AS "startedAt",
              finished_at AS "finishedAt", heartbeat_at AS "heartbeatAt"
         FROM public.sister_sync_run
        WHERE ($2::uuid IS NULL OR integration_id = $2)
        ORDER BY started_at DESC
        LIMIT $1`,
      limit,
      integrationId ?? null,
    );
  }
  async failingScopes(limit: number, integrationId?: string) {
    const rows = await this.client.$queryRawUnsafe<
      { endpoint: string; lastStatus: number; lastErrorCode: string | null; scopes: bigint; lastFetchedAt: Date }[]
    >(
      `SELECT endpoint, last_status AS "lastStatus", last_error_code AS "lastErrorCode",
              count(*) AS scopes, max(last_fetched_at) AS "lastFetchedAt"
         FROM public.sister_replica_scope
        WHERE last_status <> 200 AND ($2::uuid IS NULL OR integration_id = $2)
        GROUP BY endpoint, last_status, last_error_code
        ORDER BY count(*) DESC
        LIMIT $1`,
      limit,
      integrationId ?? null,
    );
    return rows.map((row) => ({ ...row, scopes: Number(row.scopes) }));
  }
}

// Converts driver values (bigint, Decimal, Date) into JSON-safe values.
export function toJsonSafe(value: unknown, dataType?: string): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") {
    return Number.isSafeInteger(Number(value)) ? Number(value) : value.toString();
  }
  if (value instanceof Prisma.Decimal) {
    const asNumber = value.toNumber();
    return Number.isFinite(asNumber) && Math.abs(asNumber) < 1e15 ? asNumber : value.toString();
  }
  if (value instanceof Date) {
    return dataType === "date" ? value.toISOString().slice(0, 10) : value.toISOString();
  }
  return value;
}
