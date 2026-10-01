import { jelajahModules, getJelajahModule, type JelajahModule } from "@/modules/jelajah/api/jelajah_catalog";
import { SisterNotFoundError } from "@/server/sister/errors";
import { getSisterConfig } from "@/server/sister/config";
import { replicaEndpointTemplates } from "@/server/sister/replica/replica_catalog";
import { viewNameFor } from "@/server/sister/replica/replica_views";

import {
  PrismaReplikaRepository,
  toJsonSafe,
  type ReplicaRowFilter,
  type ReplicaViewInfo,
  type ReplikaRepository,
} from "../repository/replika_repository";
import type {
  ReplikaItemInput,
  ReplikaModuleInput,
  ReplikaModulesInput,
  ReplikaRowsResult,
} from "./replika_schemas";

const maxRows = 5000;
const hiddenColumns = new Set(["r_payload", "r_integration_id"]);
const allEndpoints = new Set(replicaEndpointTemplates());
function currentIntegrationId() {
  const id = getSisterConfig().integration_id;
  if (!id) throw new ReplikaUnavailableError("ID integrasi belum dikonfigurasi untuk membaca replika.");
  return id;
}

export class ReplikaUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReplikaUnavailableError";
  }
}

function viewFor(endpoint: string) {
  return viewNameFor(endpoint, allEndpoints);
}

// Referensi variants (wilayah level, kelompok bidang) share one view and are
// told apart by the sync's scope key (sorted query string).
function scopeKeyFor(module: JelajahModule) {
  const entries = Object.entries(module.query ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return entries.length > 0 ? new URLSearchParams(entries).toString() : undefined;
}

// Child views generated for arrays inside a payload carry the comment
// "SISTER <endpoint> -> <field>[] (generated)".
function arrayChildViews(views: ReplicaViewInfo[], endpoint: string) {
  const prefix = `SISTER ${endpoint} -> `;
  return views
    .filter((view) => view.comment?.startsWith(prefix))
    .map((view) => ({
      view: view.name,
      field: view.comment!.slice(prefix.length).replace(/\[\] \(generated\)$/, ""),
    }));
}

async function readRows(
  repository: ReplikaRepository,
  views: ReplicaViewInfo[],
  view: string,
  filter: ReplicaRowFilter,
): Promise<ReplikaRowsResult> {
  if (!views.some((candidate) => candidate.name === view)) {
    throw new ReplikaUnavailableError(
      `View replica.${view} belum ada. Jalankan sync lalu \`bun run replica:views\` dan migrate.`,
    );
  }

  const [columns, rawRows] = await Promise.all([
    repository.columns(view),
    repository.rows(view, { ...filter, integrationId: currentIntegrationId() }, maxRows + 1),
  ]);
  const types = new Map(columns.map((column) => [column.name, column.dataType]));
  // Payload columns first, meta (r_*) last, so tables start with real data.
  const ordered = [
    ...columns.filter((column) => !column.name.startsWith("r_")),
    ...columns.filter((column) => column.name.startsWith("r_") && !hiddenColumns.has(column.name)),
  ].map((column) => column.name);

  const truncated = rawRows.length > maxRows;
  const rows = rawRows.slice(0, maxRows).map((row) =>
    Object.fromEntries(ordered.map((name) => [name, toJsonSafe(row[name], types.get(name))])),
  );
  const fetchedTimes = rows
    .map((row) => row.r_fetched_at)
    .filter((value): value is string => typeof value === "string")
    .sort();

  return {
    endpoint: `replica.${view}`,
    query: Object.fromEntries(
      Object.entries({ r_id_sdm: filter.idSdm, r_parent_id: filter.parentId, r_scope_key: filter.scopeKey }).filter(
        (entry): entry is [string, string] => Boolean(entry[1]),
      ),
    ),
    shape: rows.length === 0 ? "empty" : "array",
    item_count: rows.length,
    truncated,
    data: rows,
    fetched_at: fetchedTimes.at(-1) ?? new Date(0).toISOString(),
    columns: columns.filter((column) => !hiddenColumns.has(column.name)).map((column) => ({
      name: column.name,
      type: column.dataType,
    })),
  };
}

function requireModule(key: string) {
  const definition = getJelajahModule(key);
  if (!definition) {
    throw new SisterNotFoundError("Modul tidak dikenal");
  }
  return definition;
}

export async function listReplikaModules(
  input: ReplikaModulesInput,
  repository: ReplikaRepository = new PrismaReplikaRepository(),
) {
  const counts = input.id_sdm ? await repository.countByEndpointForSdm(input.id_sdm, currentIntegrationId()) : [];
  const countByEndpoint = new Map(counts.map((row) => [row.endpoint, row.count]));
  // Search modules are live-only (keyword driven); they have no replica view.
  return jelajahModules.filter((definition) => definition.kind !== "search").map((definition) => ({
    key: definition.key,
    label: definition.label,
    group: definition.group,
    kind: definition.kind,
    view: `replica.${viewFor(definition.path)}`,
    // Counts only mean something for a chosen SDM.
    count:
      definition.kind === "referensi" || !input.id_sdm
        ? null
        : (countByEndpoint.get(definition.path) ?? 0),
    has_item: Boolean(definition.detailPath || definition.children?.length),
  }));
}

export async function getReplikaRows(
  input: ReplikaModuleInput,
  repository: ReplikaRepository = new PrismaReplikaRepository(),
) {
  const definition = requireModule(input.module);
  if (definition.kind !== "referensi" && !input.id_sdm) {
    throw new ReplikaUnavailableError("Pilih SDM terlebih dahulu");
  }
  const views = await repository.listViews();
  return readRows(repository, views, viewFor(definition.path), {
    idSdm: definition.kind === "referensi" ? undefined : input.id_sdm,
    scopeKey: definition.kind === "referensi" ? scopeKeyFor(definition) : undefined,
  });
}

// Detail row plus every related table for one item, all from local views.
export async function getReplikaItem(
  input: ReplikaItemInput,
  repository: ReplikaRepository = new PrismaReplikaRepository(),
) {
  const definition = requireModule(input.module);
  const views = await repository.listViews();
  const sections: { key: string; label: string; result: ReplikaRowsResult }[] = [];

  let detailRow: Record<string, unknown> | null = null;
  if (definition.detailPath) {
    const detail = await readRows(repository, views, viewFor(definition.detailPath), { parentId: input.id });
    detailRow = (detail.data as Record<string, unknown>[])[0] ?? null;
    sections.push({ key: "detail", label: "Detail", result: detail });
    for (const child of arrayChildViews(views, definition.detailPath)) {
      sections.push({
        key: child.view,
        label: child.field.replaceAll("_", " "),
        result: await readRows(repository, views, child.view, { parentId: input.id }),
      });
    }
  }

  for (const child of definition.children ?? []) {
    const sourceValue = child.sourceField ? (detailRow?.[child.sourceField] ?? input.source_value) : input.id;
    if (typeof sourceValue !== "string" || sourceValue.length === 0) {
      continue;
    }
    const childView = viewFor(child.path);
    sections.push({
      key: child.key,
      label: child.label,
      result: await readRows(repository, views, childView, { parentId: sourceValue }),
    });
    for (const nested of arrayChildViews(views, child.path)) {
      sections.push({
        key: nested.view,
        label: `${child.label}: ${nested.field.replaceAll("_", " ")}`,
        result: await readRows(repository, views, nested.view, { parentId: sourceValue }),
      });
    }
  }

  return { module: definition.key, id: input.id, sections };
}

export async function getReplikaSyncStatus(repository: ReplikaRepository = new PrismaReplikaRepository()) {
  const integrationId = currentIntegrationId();
  const [runs, failing] = await Promise.all([repository.syncRuns(20, integrationId), repository.failingScopes(50, integrationId)]);
  return {
    runs: runs.map((run) => ({
      id: run.id,
      scope: run.scope,
      status: run.status,
      target: run.baseUrl.includes("sandbox") ? "sandbox" : "production",
      request_count: run.requestCount,
      record_count: run.recordCount,
      changed_count: run.changedCount,
      deleted_count: run.deletedCount,
      error_count: run.errorCount,
      started_at: run.startedAt.toISOString(),
      finished_at: run.finishedAt?.toISOString() ?? null,
      heartbeat_at: run.heartbeatAt?.toISOString() ?? null,
    })),
    failing_scopes: failing.map((row) => ({
      endpoint: row.endpoint,
      status: row.lastStatus,
      code: row.lastErrorCode,
      scopes: row.scopes,
      last_fetched_at: row.lastFetchedAt.toISOString(),
    })),
  };
}
