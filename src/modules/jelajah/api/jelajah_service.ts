import { getSisterConfig } from "@/server/sister/config";
import { SisterNotFoundError } from "@/server/sister/errors";

import { fetchSisterRaw, type JelajahFetcher } from "./jelajah_adapter";
import { getJelajahModule, jelajahModules, type JelajahModule } from "./jelajah_catalog";
import {
  jelajahResultSchema,
  type JelajahChildInput,
  type JelajahDetailInput,
  type JelajahListInput,
  type JelajahResult,
} from "./jelajah_schemas";

const pageSize = 100;
const maxPages = 20;
const ownPtCacheMs = 10 * 60 * 1000;

export class JelajahUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JelajahUnavailableError";
  }
}

let ownPtCache: { id: string; expiresAt: number } | null = null;

export function clearJelajahOwnPtCache() {
  ownPtCache = null;
}

function requireLiveMode() {
  if (getSisterConfig().fixture_mode) {
    throw new JelajahUnavailableError("Jelajah data hanya tersedia pada mode live (SISTER_FIXTURE_MODE=false)");
  }
}

function requireModule(key: string): JelajahModule {
  const definition = getJelajahModule(key);
  if (!definition) {
    throw new SisterNotFoundError("Modul tidak dikenal");
  }
  return definition;
}

function toResult(
  definition: JelajahModule,
  endpoint: string,
  query: Record<string, string>,
  data: unknown,
): JelajahResult {
  const isArray = Array.isArray(data);
  const isEmptyObject =
    data === null ||
    (typeof data === "object" && !isArray && Object.keys(data as object).length === 0);
  return jelajahResultSchema.parse({
    module: definition.key,
    endpoint,
    query,
    shape: isEmptyObject ? "empty" : isArray ? "array" : "object",
    item_count: isArray ? (data as unknown[]).length : isEmptyObject ? 0 : 1,
    data: data ?? null,
    fetched_at: new Date().toISOString(),
    source: "sister",
  });
}

async function getOwnPtId(fetcher: JelajahFetcher) {
  if (ownPtCache && ownPtCache.expiresAt > Date.now()) {
    return ownPtCache.id;
  }
  const profil = await fetcher("/referensi/profil_pt");
  const record = Array.isArray(profil) ? profil[0] : profil;
  const id =
    record && typeof record === "object"
      ? ((record as Record<string, unknown>).id_perguruan_tinggi ?? (record as Record<string, unknown>).id)
      : null;
  if (typeof id !== "string" || id.length === 0) {
    throw new JelajahUnavailableError("id_perguruan_tinggi tidak ditemukan pada /referensi/profil_pt");
  }
  ownPtCache = { id, expiresAt: Date.now() + ownPtCacheMs };
  return id;
}

export function listJelajahModules() {
  return jelajahModules.map((definition) => ({
    key: definition.key,
    label: definition.label,
    group: definition.group,
    kind: definition.kind,
    endpoint: definition.path,
    has_detail: Boolean(definition.detailPath),
    search_fields: (definition.searchFields ?? []).map((field) => ({
      name: field.name,
      label: field.label,
      input: field.input,
      required: Boolean(field.required),
    })),
    children: (definition.children ?? []).map((child) => ({
      key: child.key,
      label: child.label,
      endpoint: child.path,
      source_field: child.sourceField ?? "id",
    })),
    paginated: Boolean(definition.paginated),
    note: definition.note ?? null,
  }));
}

export async function getJelajahList(
  input: JelajahListInput,
  fetcher: JelajahFetcher = fetchSisterRaw,
): Promise<JelajahResult> {
  requireLiveMode();
  const definition = requireModule(input.module);

  if ((definition.kind === "sdm_list" || definition.kind === "sdm_object") && !input.id_sdm) {
    throw new JelajahUnavailableError("Pilih SDM terlebih dahulu");
  }

  if (definition.kind === "sdm_object") {
    const data = await fetcher(definition.path.replace("{id_sdm}", encodeURIComponent(input.id_sdm!)));
    return toResult(definition, definition.path, { id_sdm: input.id_sdm! }, data);
  }

  const query: Record<string, string> = { ...definition.query };
  if (definition.kind === "sdm_list") {
    query.id_sdm = input.id_sdm!;
  }
  if (definition.kind === "search") {
    // Only the module's declared fields are forwarded to SISTER.
    for (const field of definition.searchFields ?? []) {
      const value = input.search?.[field.name];
      if (value) {
        query[field.name] = value;
      } else if (field.required) {
        throw new JelajahUnavailableError(`Isi ${field.label} terlebih dahulu`);
      }
    }
    if (definition.searchAnyOf && !definition.searchAnyOf.some((name) => query[name])) {
      throw new JelajahUnavailableError(
        `Isi salah satu: ${definition.searchAnyOf.join(" atau ")}`,
      );
    }
  }
  if (definition.ownPtQuery) {
    query[definition.ownPtQuery] = await getOwnPtId(fetcher);
  }

  if (!definition.paginated) {
    return toResult(definition, definition.path, query, await fetcher(definition.path, query));
  }

  const items: unknown[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const data = await fetcher(definition.path, {
      ...query,
      per_page: String(pageSize),
      page: String(page),
    });
    const pageItems = Array.isArray(data) ? data : data ? [data] : [];
    items.push(...pageItems);
    if (pageItems.length < pageSize) {
      break;
    }
  }
  return toResult(definition, definition.path, query, items);
}

export async function getJelajahDetail(
  input: JelajahDetailInput,
  fetcher: JelajahFetcher = fetchSisterRaw,
): Promise<JelajahResult> {
  requireLiveMode();
  const definition = requireModule(input.module);
  if (!definition.detailPath) {
    throw new JelajahUnavailableError("Modul ini tidak memiliki endpoint detail");
  }

  const data = await fetcher(definition.detailPath.replace("{id}", encodeURIComponent(input.id)));
  if (data === null) {
    throw new SisterNotFoundError("Data tidak ditemukan");
  }
  return toResult(definition, definition.detailPath, { id: input.id }, data);
}

export async function getJelajahChild(
  input: JelajahChildInput,
  fetcher: JelajahFetcher = fetchSisterRaw,
): Promise<JelajahResult> {
  requireLiveMode();
  const definition = requireModule(input.module);
  const child = definition.children?.find((candidate) => candidate.key === input.child);
  if (!child) {
    throw new JelajahUnavailableError("Modul ini tidak memiliki data turunan tersebut");
  }

  if (child.queryParam) {
    const query = { [child.queryParam]: input.id };
    return toResult(definition, child.path, query, await fetcher(child.path, query));
  }

  const data = await fetcher(child.path.replace("{id}", encodeURIComponent(input.id)));
  return toResult(definition, child.path, { id: input.id }, data);
}
