import { getJelajahModule, jelajahModules, type JelajahModule } from "@/modules/jelajah/api/jelajah_catalog";
import { SisterNotFoundError } from "@/server/sister/errors";
import { getSisterConfig } from "@/server/sister/config";
import { replicaEndpointTemplates } from "@/server/sister/replica/replica_catalog";
import { viewNameFor } from "@/server/sister/replica/replica_views";

import { businessJsonValue, PrismaBusinessRepository } from "../repository/business_repository";
import type { BusinessRowsInput, BusinessSdmInput } from "./business_schemas";

const endpoints = new Set(replicaEndpointTemplates());
const pageSizeDefault = 20;

export class BusinessDataUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessDataUnavailableError";
  }
}

function integrationId() {
  let value: string | null;
  try {
    value = getSisterConfig().integration_id;
  } catch {
    throw new BusinessDataUnavailableError("Konfigurasi SISTER belum lengkap untuk membaca replika.");
  }
  if (!value) throw new BusinessDataUnavailableError("ID integrasi belum dikonfigurasi untuk membaca replika.");
  return value;
}

function scopeKey(values: Record<string, string>) {
  const entries = Object.entries(values).sort(([left], [right]) => left.localeCompare(right));
  return entries.length ? new URLSearchParams(entries).toString() : "-";
}

function requireModule(key: string) {
  const catalogEntry = getJelajahModule(key);
  if (!catalogEntry) throw new SisterNotFoundError("Modul tidak dikenal");
  return catalogEntry;
}

function requireView(viewNames: { name: string }[], endpoint: string) {
  const view = viewNameFor(endpoint, endpoints);
  if (!viewNames.some((candidate) => candidate.name === view)) {
    throw new BusinessDataUnavailableError("View replika belum tersedia untuk endpoint ini.");
  }
  return view;
}

function presentScopeCount(scope: Awaited<ReturnType<PrismaBusinessRepository["scope"]>>, itemCount: number) {
  const source = presentScope(scope);
  return source ? { ...source, item_count: itemCount } : null;
}

function presentScope(scope: (Awaited<ReturnType<PrismaBusinessRepository["scope"]>> & { scopeCount?: number; failedScopeCount?: number }) | null) {
  return scope
    ? {
        status: scope.lastStatus,
        scope_count: scope.scopeCount,
        failed_scope_count: scope.failedScopeCount,
        error_code: scope.lastErrorCode,
        item_count: scope.itemCount,
        last_fetched_at: scope.lastFetchedAt.toISOString(),
        last_success_at: scope.lastSuccessAt?.toISOString() ?? null,
      }
    : null;
}

function presentRows(
  rows: Record<string, unknown>[],
  columns: { name: string; dataType: string }[],
) {
  const payloadColumns = columns.filter((column) => !column.name.startsWith("r_"));
  return rows.map((row) => ({
    id: String(row.id ?? row.id_sdm ?? row.id_dokumen ?? row.r_item_key ?? ""),
    row_key: `${row.r_scope_key ?? ""}:${row.r_item_key ?? row.id ?? ""}`,
    id_sdm: typeof row.r_id_sdm === "string" ? row.r_id_sdm : undefined,
    nama_sdm: typeof row.owner_name === "string" ? row.owner_name : undefined,
    values: Object.fromEntries(
      payloadColumns.map((column) => [column.name, businessJsonValue(row[column.name], column.dataType)]),
    ),
  }));
}

async function resolveListScope(
  module: JelajahModule,
  input: { id_sdm?: string; id_smt?: string },
  integration: string,
  repository: PrismaBusinessRepository,
) {
  if (module.query) {
    const key = scopeKey(module.query);
    return { key, meta: await repository.scope(integration, module.path, key), idSdm: undefined };
  }
  if (module.ownPtQuery) {
    const meta = await repository.latestScope(integration, module.path);
    return { key: meta?.scopeKey, meta, idSdm: undefined };
  }
  if (module.kind === "referensi") {
    return { key: "-", meta: await repository.scope(integration, module.path, "-"), idSdm: undefined };
  }
  if (!input.id_sdm && module.kind === "sdm_list") {
    return { key: undefined, meta: await repository.scopeSummary(integration, module.path, input.id_smt), idSdm: undefined };
  }
  if (!input.id_sdm) throw new BusinessDataUnavailableError("Pilih SDM terlebih dahulu.");
  const query = { id_sdm: input.id_sdm };
  if (module.key.startsWith("bkd_") && module.key !== "bkd_laporan_akhir" && input.id_smt) {
    Object.assign(query, { id_smt: input.id_smt });
  }
  const key = scopeKey(query);
  return { key, meta: await repository.scope(integration, module.path, key), idSdm: input.id_sdm };
}

async function requireKnownSdm(idSdm: string, integration: string, repository: PrismaBusinessRepository) {
  const view = viewNameFor("/referensi/sdm", endpoints);
  const row = await repository.rows(view, { integrationId: integration, scopeKey: "-", itemKey: idSdm }, 1);
  if (row.length === 0) throw new SisterNotFoundError("SDM tidak ditemukan pada replika PT ini.");
}

export async function searchBusinessSdm(
  input: BusinessSdmInput,
  repository = new PrismaBusinessRepository(),
) {
  const integration = integrationId();
  const views = await repository.listViews();
  const view = requireView(views, "/referensi/sdm");
  const filter = { integrationId: integration, scopeKey: "-" };
  const [columns, rows, total, meta] = await Promise.all([
    repository.columns(view),
    repository.rows(view, filter, input.per_page, (input.page - 1) * input.per_page, input.search),
    repository.count(view, filter, input.search),
    repository.scope(integration, "/referensi/sdm", "-"),
  ]);
  return {
    rows: presentRows(rows, columns),
    total,
    page: input.page,
    per_page: input.per_page,
    endpoint: "/referensi/sdm",
    source: presentScope(meta),
  };
}

export async function getBusinessRows(
  input: BusinessRowsInput,
  repository = new PrismaBusinessRepository(),
) {
  const catalogEntry = requireModule(input.module);
  if (catalogEntry.kind === "search") throw new BusinessDataUnavailableError("Modul ini membutuhkan pencarian langsung.");
  const integration = integrationId();
  if (catalogEntry.kind !== "referensi" && input.id_sdm) {
    await requireKnownSdm(input.id_sdm, integration, repository);
  }
  if (catalogEntry.kind === "sdm_object" && !input.id_sdm) {
    throw new BusinessDataUnavailableError("Pilih SDM terlebih dahulu.");
  }

  if (catalogEntry.key.startsWith("bkd_") && input.id_sdm && !input.id_smt) {
    throw new BusinessDataUnavailableError("Pilih semester terlebih dahulu.");
  }
  const views = await repository.listViews();
  const view = requireView(views, catalogEntry.path);
  const resolved = await resolveListScope(catalogEntry, input, integration, repository);
  const filter = {
    integrationId: integration,
    ...(resolved.idSdm ? { idSdm: resolved.idSdm } : {}),
    ...(resolved.key ? { scopeKey: resolved.key } : {}),
    ...(!input.id_sdm && catalogEntry.kind === "sdm_list" ? { includeSdm: true, semester: input.id_smt } : {}),
  };
  const page = input.page ?? 1;
  const perPage = input.per_page ?? pageSizeDefault;
  const listLimit = catalogEntry.kind === "sdm_object" && catalogEntry.key !== "bidang_ilmu_sdm" ? 1 : perPage;
  const listOffset = catalogEntry.kind === "sdm_object" && catalogEntry.key !== "bidang_ilmu_sdm" ? 0 : (page - 1) * perPage;
  const [columns, rows, total] = await Promise.all([
    repository.columns(view),
    repository.rows(view, filter, listLimit, listOffset, input.search),
    repository.count(view, filter, input.search),
  ]);
  const idSdm = input.id_sdm;
  const related = catalogEntry.kind === "sdm_object" && idSdm
    ? await Promise.all(views.filter((candidate) => candidate.comment?.startsWith("SISTER " + catalogEntry.path + " -> ")).map(async (candidate) => {
        const prefix = "SISTER " + catalogEntry.path + " -> ";
        const label = candidate.comment!.slice(prefix.length).replace(/\[\] \(generated\)$/, "").replaceAll("_", " ");
        const childFilter = {
          integrationId: integration,
          idSdm,
          parentId: idSdm,
          ...(resolved.key ? { scopeKey: resolved.key } : {}),
        };
        const [childColumns, childRows, childTotal] = await Promise.all([
          repository.columns(candidate.name),
          repository.rows(candidate.name, childFilter, perPage, (page - 1) * perPage),
          repository.count(candidate.name, childFilter),
        ]);
        return {
          key: candidate.name,
          label,
          columns: childColumns.filter((column) => !column.name.startsWith("r_")).map((column) => ({ key: column.name, type: column.dataType })),
          rows: presentRows(childRows, childColumns),
          total: childTotal,
          page,
          per_page: perPage,
          source: presentScopeCount(resolved.meta, childTotal),
        };
      }))
    : [];
  return {
    module: catalogEntry.key,
    endpoint: catalogEntry.path,
    columns: columns.filter((column) => !column.name.startsWith("r_")).map((column) => ({ key: column.name, type: column.dataType })),
    rows: presentRows(rows, columns),
    related,
    total,
    page,
    per_page: perPage,
    source: presentScope(resolved.meta),
    note: catalogEntry.note ?? null,
  };
}


export async function getBusinessDetail(
  input: { module: string; id: string; id_sdm?: string; page?: number; per_page?: number },
  repository = new PrismaBusinessRepository(),
) {
  const catalogEntry = requireModule(input.module);
  if (catalogEntry.kind === "search") throw new BusinessDataUnavailableError("Detail ini berasal dari pencarian langsung.");
  const integration = integrationId();
  const isSdmScoped = catalogEntry.kind !== "referensi";
  if (isSdmScoped) {
    if (!input.id_sdm) throw new BusinessDataUnavailableError("Pilih SDM terlebih dahulu.");
    await requireKnownSdm(input.id_sdm, integration, repository);
  }
  const page = input.page ?? 1;
  const perPage = input.per_page ?? pageSizeDefault;
  const offset = (page - 1) * perPage;
  const views = await repository.listViews();
  const listView = requireView(views, catalogEntry.path);
  const listScope = await resolveListScope(catalogEntry, { id_sdm: input.id_sdm }, integration, repository);
  const listFilter = {
    integrationId: integration,
    ...(input.id_sdm && isSdmScoped ? { idSdm: input.id_sdm } : {}),
    ...(listScope.key ? { scopeKey: listScope.key } : {}),
    itemKey: input.id,
  };
  const listColumns = await repository.columns(listView);
  const listRecords = await repository.rows(listView, listFilter, 1);
  const base = listRecords[0];
  if (!base) throw new SisterNotFoundError("Data tidak ditemukan pada replika untuk SDM ini.");
  const baseValues = presentRows(listRecords, listColumns)[0];
  let relationValues = baseValues.values;
  const sections: {
    key: string;
    label: string;
    endpoint: string;
    columns: { key: string; type: string }[];
    rows: { id: string; values: Record<string, unknown> }[];
    source: ReturnType<typeof presentScope>;
    total: number;
    page: number;
    per_page: number;
  }[] = [];

  if (catalogEntry.detailPath) {
    const detailEndpoint = catalogEntry.detailPath.replace("{id}", input.id);
    const detailView = requireView(views, catalogEntry.detailPath);
    const detailKey = scopeKey({ id: input.id });
    const detailSource = await repository.scope(integration, catalogEntry.detailPath, detailKey);
    const detailFilter = {
      integrationId: integration,
      parentId: input.id,
    };
    const [columns, records, detailTotal] = await Promise.all([
      repository.columns(detailView),
      repository.rows(detailView, detailFilter, 1),
      repository.count(detailView, detailFilter),
    ]);
    const detail = records[0] ? presentRows(records, columns)[0] : null;
    if (detail) relationValues = detail.values;
    sections.push({
      key: "detail",
      label: "Detail",
      endpoint: detailEndpoint,
      columns: columns.filter((column) => !column.name.startsWith("r_")).map((column) => ({ key: column.name, type: column.dataType })),
      rows: detail ? [detail] : [],
      source: presentScope(detailSource),
      total: detailTotal,
      page: 1,
      per_page: 1,
    });

    const prefix = "SISTER " + catalogEntry.detailPath + " -> ";
    for (const child of views.filter((candidate) => candidate.comment?.startsWith(prefix))) {
      const field = child.comment!.slice(prefix.length).replace(/\[\] \(generated\)$/, "");
      const childFilter = {
        integrationId: integration,
        parentId: input.id,
      };
      const [childColumns, childRows, childTotal] = await Promise.all([
        repository.columns(child.name),
        repository.rows(child.name, childFilter, perPage, offset),
        repository.count(child.name, childFilter),
      ]);
      sections.push({
        key: child.name,
        label: field.replaceAll("_", " "),
        endpoint: detailEndpoint,
        columns: childColumns.filter((column) => !column.name.startsWith("r_")).map((column) => ({ key: column.name, type: column.dataType })),
        rows: presentRows(childRows, childColumns),
        source: presentScopeCount(detailSource, childTotal),
        total: childTotal,
        page,
        per_page: perPage,
      });
    }
  } else {
    sections.push({
      key: "detail",
      label: "Detail",
      endpoint: catalogEntry.path,
      columns: listColumns.filter((column) => !column.name.startsWith("r_")).map((column) => ({ key: column.name, type: column.dataType })),
      rows: [baseValues],
      source: presentScope(listScope.meta),
      total: 1,
      page: 1,
      per_page: 1,
    });
  }

  for (const child of catalogEntry.children ?? []) {
    const sourceValue = child.sourceField ? relationValues[child.sourceField] : input.id;
    if (typeof sourceValue !== "string" || sourceValue.length === 0) continue;
    const childEndpoint = child.path.replace("{id}", sourceValue);
    const childView = requireView(views, child.path);
    const childScopeKey = child.queryParam ? scopeKey({ [child.queryParam]: sourceValue }) : scopeKey({ id: sourceValue });
    const childSource = await repository.scope(integration, child.path, childScopeKey);
    const childFilter = {
      integrationId: integration,
      parentId: sourceValue,
    };
    const [childColumns, childRows, childTotal] = await Promise.all([
      repository.columns(childView),
      repository.rows(childView, childFilter, perPage, offset),
      repository.count(childView, childFilter),
    ]);
    sections.push({
      key: child.key,
      label: child.label,
      endpoint: childEndpoint,
      columns: childColumns.filter((column) => !column.name.startsWith("r_")).map((column) => ({ key: column.name, type: column.dataType })),
      rows: presentRows(childRows, childColumns),
      source: presentScope(childSource),
      total: childTotal,
      page,
      per_page: perPage,
    });
  }

  return { module: catalogEntry.key, id: input.id, id_sdm: input.id_sdm ?? null, sections };
}


export function businessModules() {
  return jelajahModules.map(({ key, label, group, kind, path, note }) => ({ key, label, group, kind, path, note: note ?? null }));
}
