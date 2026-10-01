import { Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

type BusinessFilter = {
  integrationId: string;
  idSdm?: string;
  parentId?: string;
  scopeKey?: string;
  itemKey?: string;
};

type BusinessScope = {
  endpoint: string;
  scopeKey: string;
  itemCount: number;
  lastStatus: number;
  lastErrorCode: string | null;
  lastFetchedAt: Date;
  lastSuccessAt: Date | null;
};

type BusinessClient = Pick<PrismaClient, "$queryRawUnsafe">;

function quoteIdent(name: string) {
  return `"${name.replaceAll('"', '""')}"`;
}

function whereFor(filter: BusinessFilter) {
  const conditions = ["r_integration_id = $1"];
  const params: unknown[] = [filter.integrationId];
  for (const [column, value] of [
    ["r_id_sdm", filter.idSdm],
    ["r_parent_id", filter.parentId],
    ["r_scope_key", filter.scopeKey],
    ["r_item_key", filter.itemKey],
  ] as const) {
    if (value !== undefined) {
      params.push(value);
      conditions.push(`${column} = $${params.length}`);
    }
  }
  return { conditions, params };
}

export class PrismaBusinessRepository {
  constructor(private readonly client: BusinessClient = prisma) {}

  async listViews() {
    return this.client.$queryRawUnsafe<{ name: string; comment: string | null }[]>(
      `SELECT c.relname AS name, obj_description(c.oid, 'pg_class') AS comment
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'replica' AND c.relkind = 'v'
        ORDER BY c.relname`,
    );
  }

  async columns(view: string) {
    return this.client.$queryRawUnsafe<{ name: string; dataType: string }[]>(
      `SELECT column_name AS name, data_type AS "dataType"
         FROM information_schema.columns
        WHERE table_schema = 'replica' AND table_name = $1
        ORDER BY ordinal_position`,
      view,
    );
  }

  async rows(view: string, filter: BusinessFilter, limit: number, offset = 0, search = "") {
    const { conditions, params } = whereFor(filter);
    if (search) {
      const columns = (await this.columns(view))
        .map((column) => column.name)
        .filter((name) => !name.startsWith("r_"));
      if (columns.length > 0) {
        const terms = columns.map((name) => `COALESCE(${quoteIdent(name)}::text, '')`).join(", ");
        const escaped = search.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
        params.push(`%${escaped}%`);
        conditions.push(`concat_ws(' ', ${terms}) ILIKE $${params.length} ESCAPE '\\'`);
      }
    }
    params.push(limit, offset);
    return this.client.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM replica.${quoteIdent(view)} WHERE ${conditions.join(" AND ")} ORDER BY r_item_key LIMIT $${params.length - 1} OFFSET $${params.length}`,
      ...params,
    );
  }

  async count(view: string, filter: BusinessFilter, search = "") {
    const { conditions, params } = whereFor(filter);
    if (search) {
      const columns = (await this.columns(view))
        .map((column) => column.name)
        .filter((name) => !name.startsWith("r_"));
      if (columns.length > 0) {
        const terms = columns.map((name) => `COALESCE(${quoteIdent(name)}::text, '')`).join(", ");
        const escaped = search.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
        params.push(`%${escaped}%`);
        conditions.push(`concat_ws(' ', ${terms}) ILIKE $${params.length} ESCAPE '\\'`);
      }
    }
    const result = await this.client.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT count(*) AS count FROM replica.${quoteIdent(view)} WHERE ${conditions.join(" AND ")}`,
      ...params,
    );
    return Number(result[0]?.count ?? 0);
  }

  async scope(integrationId: string, endpoint: string, scopeKey: string) {
    const rows = await this.client.$queryRawUnsafe<BusinessScope[]>(
      `SELECT endpoint, scope_key AS "scopeKey", item_count AS "itemCount",
              last_status AS "lastStatus", last_error_code AS "lastErrorCode",
              last_fetched_at AS "lastFetchedAt", last_success_at AS "lastSuccessAt"
         FROM public.sister_replica_scope
        WHERE integration_id = $1 AND endpoint = $2 AND scope_key = $3
        LIMIT 1`,
      integrationId,
      endpoint,
      scopeKey,
    );
    return rows[0] ?? null;
  }

  async latestScope(integrationId: string, endpoint: string) {
    const rows = await this.client.$queryRawUnsafe<BusinessScope[]>(
      `SELECT endpoint, scope_key AS "scopeKey", item_count AS "itemCount",
              last_status AS "lastStatus", last_error_code AS "lastErrorCode",
              last_fetched_at AS "lastFetchedAt", last_success_at AS "lastSuccessAt"
         FROM public.sister_replica_scope
        WHERE integration_id = $1 AND endpoint = $2
        ORDER BY last_fetched_at DESC
        LIMIT 1`,
      integrationId,
      endpoint,
    );
    return rows[0] ?? null;
  }
}

export function businessJsonValue(value: unknown, dataType?: string): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") {
    return Number.isSafeInteger(Number(value)) ? Number(value) : value.toString();
  }
  if (value instanceof Prisma.Decimal) {
    const number = value.toNumber();
    return Number.isFinite(number) && Math.abs(number) < 1e15 ? number : value.toString();
  }
  if (value instanceof Date) {
    return dataType === "date" ? value.toISOString().slice(0, 10) : value.toISOString();
  }
  if (Array.isArray(value)) return value.map((item) => businessJsonValue(item));
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, businessJsonValue(item)]));
  }
  return value;
}
