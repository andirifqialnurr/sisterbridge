import { Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import type { CoverageRecordCount, CoverageScopeCount } from "@/server/sister/replica/replica_coverage";

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
  itemKey?: string;
  search?: string;
};

export type ReplikaRepository = {
  coverageCounts(integrationId: string): Promise<{ records: CoverageRecordCount[]; scopes: CoverageScopeCount[] }>;
  listViews(): Promise<ReplicaViewInfo[]>;
  columns(view: string): Promise<ReplicaColumnInfo[]>;
  rows(view: string, filter: ReplicaRowFilter, limit: number, offset?: number): Promise<Record<string, unknown>[]>;
  count(view: string, filter: ReplicaRowFilter): Promise<number>;
  countByEndpointForSdm(idSdm: string, integrationId?: string): Promise<{ endpoint: string; count: number }[]>;
  syncRuns(limit: number, integrationId: string, offset?: number): Promise<SyncRunRow[]>;
  countSyncRuns(integrationId: string): Promise<number>;
  failingScopes(limit: number, integrationId: string, offset?: number): Promise<FailingScopeRow[]>;
  countFailingScopeGroups(integrationId: string): Promise<number>;
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

  async coverageCounts(integrationId: string) {
    const [records, scopes] = await Promise.all([
      this.client.$queryRawUnsafe<{ endpoint: string; count: bigint }[]>(
        `SELECT endpoint, count(*) AS count FROM public.sister_replica_record
          WHERE integration_id = $1::uuid AND deleted_at IS NULL GROUP BY endpoint`, integrationId,
      ),
      this.client.$queryRawUnsafe<{ endpoint: string; status: number; count: bigint; lastFetchedAt: Date | null }[]>(
        `SELECT endpoint, last_status AS status, count(*) AS count, max(last_fetched_at) AS "lastFetchedAt"
           FROM public.sister_replica_scope WHERE integration_id = $1::uuid
          GROUP BY endpoint, last_status`, integrationId,
      ),
    ]);
    return {
      records: records.map(row => ({ ...row, count: Number(row.count) })),
      scopes: scopes.map(row => ({ ...row, count: Number(row.count) })),
    };
  }

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

  private async where(view: string, filter: ReplicaRowFilter) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter.integrationId) {
      params.push(filter.integrationId);
      conditions.push(`r_integration_id = $${params.length}::uuid`);
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
    if (filter.itemKey) {
      params.push(filter.itemKey);
      conditions.push(`r_item_key = $${params.length}`);
    }
    if (filter.search) {
      const columns = (await this.columns(view)).map((column) => column.name).filter((name) => !name.startsWith("r_"));
      if (columns.length) {
        const escaped = filter.search.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
        params.push(`%${escaped}%`);
        conditions.push(`concat_ws(' ', ${columns.map((name) => `COALESCE(${quoteIdent(name)}::text, '')`).join(", ")}) ILIKE $${params.length} ESCAPE '\\'`);
      }
    }
    return { sql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "", params };
  }

  async rows(view: string, filter: ReplicaRowFilter, limit: number, offset = 0) {
    const { sql, params } = await this.where(view, filter);
    params.push(limit, offset);
    return this.client.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM replica.${quoteIdent(view)} ${sql} ORDER BY r_item_key, r_scope_key LIMIT $${params.length - 1} OFFSET $${params.length}`,
      ...params,
    );
  }

  async count(view: string, filter: ReplicaRowFilter) {
    const { sql, params } = await this.where(view, filter);
    const rows = await this.client.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT count(*) AS count FROM replica.${quoteIdent(view)} ${sql}`, ...params,
    );
    return Number(rows[0]?.count ?? 0);
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

  async syncRuns(limit: number, integrationId: string, offset = 0) {
    return this.client.$queryRawUnsafe<SyncRunRow[]>(
      `SELECT id, scope, status::text AS status, base_url AS "baseUrl",
              request_count AS "requestCount", record_count AS "recordCount",
              changed_count AS "changedCount", deleted_count AS "deletedCount",
              error_count AS "errorCount", started_at AS "startedAt",
              finished_at AS "finishedAt", heartbeat_at AS "heartbeatAt"
         FROM public.sister_sync_run
        WHERE integration_id = $2::uuid
        ORDER BY started_at DESC, id DESC
        LIMIT $1 OFFSET $3`,
      limit,
      integrationId,
      offset,
    );
  }
  async countSyncRuns(integrationId: string) {
    const rows = await this.client.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT count(*) AS count FROM public.sister_sync_run WHERE integration_id = $1::uuid`, integrationId,
    );
    return Number(rows[0]?.count ?? 0);
  }

  async failingScopes(limit: number, integrationId: string, offset = 0) {
    const rows = await this.client.$queryRawUnsafe<
      { endpoint: string; lastStatus: number; lastErrorCode: string | null; scopes: bigint; lastFetchedAt: Date }[]
    >(
      `SELECT endpoint, last_status AS "lastStatus", last_error_code AS "lastErrorCode",
              count(*) AS scopes, max(last_fetched_at) AS "lastFetchedAt"
         FROM public.sister_replica_scope
        WHERE last_status <> 200 AND integration_id = $2::uuid
        GROUP BY endpoint, last_status, last_error_code
        ORDER BY count(*) DESC, endpoint, last_status, last_error_code NULLS FIRST
        LIMIT $1 OFFSET $3`,
      limit,
      integrationId,
      offset,
    );
    return rows.map((row) => ({ ...row, scopes: Number(row.scopes) }));
  }

  async countFailingScopeGroups(integrationId: string) {
    const rows = await this.client.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT count(*) AS count FROM (
        SELECT 1 FROM public.sister_replica_scope
         WHERE integration_id = $1::uuid AND last_status <> 200
         GROUP BY endpoint, last_status, last_error_code
       ) grouped`, integrationId,
    );
    return Number(rows[0]?.count ?? 0);
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
