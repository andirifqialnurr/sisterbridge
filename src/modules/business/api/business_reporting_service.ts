import { getSisterConfig } from "@/server/sister/config";
import { replicaEndpointTemplates } from "@/server/sister/replica/replica_catalog";
import { jelajahModules } from "@/modules/jelajah/api/jelajah_catalog";

import type { BusinessReportInput } from "./business_schemas";
import {
  PrismaBusinessReportingRepository,
  type BkdReportRow,
  type OutputReportRow,
  type SdmReportRow,
} from "../repository/business_reporting_repository";

export class BusinessReportUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessReportUnavailableError";
  }
}

function integrationId() {
  let value: string | null;
  try {
    value = getSisterConfig().integration_id;
  } catch {
    throw new BusinessReportUnavailableError("Konfigurasi SISTER belum lengkap untuk membaca replika.");
  }
  if (!value) throw new BusinessReportUnavailableError("ID integrasi belum dikonfigurasi untuk membaca replika.");
  return value;
}

function sourceSummary(groups: Awaited<ReturnType<PrismaBusinessReportingRepository["scopeGroups"]>>, endpoints: string[]) {
  const selected = groups.filter((group) => endpoints.includes(group.endpoint));
  const times = selected.map((group) => group.last_fetched_at).filter((value): value is Date => value !== null);
  return {
    scope_count: selected.reduce((sum, row) => sum + row.total, 0),
    failed_scope_count: selected.reduce((sum, row) => sum + row.failed, 0),
    not_found_scope_count: selected.reduce((sum, row) => sum + row.not_found, 0),
    oldest_fetch_at: times.sort((a, b) => a.getTime() - b.getTime())[0]?.toISOString() ?? null,
  };
}

const endpointsForReport = {
  sdm: ["/referensi/sdm"],
  luaran: ["/publikasi", "/penelitian", "/pengabdian"],
  bkd: ["/bkd/laporan_akhir_bkd"],
} as const;

export async function getBusinessReport(input: BusinessReportInput, repository = new PrismaBusinessReportingRepository()) {
  const integration = integrationId();
  const scopeGroups = await repository.scopeGroups(integration);
  if (input.kind === "sdm") {
    const groups = await repository.sdmGroups(integration);
    const selected = Boolean(input.jenis_sdm || input.status_aktif);
    let rows: SdmReportRow[] = [];
    let total = 0;
    if (selected) {
      [rows, total] = await Promise.all([
        repository.sdmRows(integration, input.jenis_sdm ?? null, input.status_aktif ?? null, input.per_page, (input.page - 1) * input.per_page),
        repository.countSdmRows(integration, input.jenis_sdm ?? null, input.status_aktif ?? null),
      ]);
    }
    return { kind: input.kind, groups, rows, total, page: input.page, per_page: input.per_page, source: sourceSummary(scopeGroups, [...endpointsForReport.sdm]) };
  }
  if (input.kind === "luaran") {
    const groups = await repository.outputGroups(integration);
    const selected = Boolean(input.module && input.tahun);
    let rows: OutputReportRow[] = [];
    let total = 0;
    if (selected && input.module && input.tahun) {
      [rows, total] = await Promise.all([
        repository.outputRows(integration, input.module, input.tahun, input.per_page, (input.page - 1) * input.per_page),
        repository.countOutputRows(integration, input.module, input.tahun),
      ]);
    }
    return { kind: input.kind, groups, rows, total, page: input.page, per_page: input.per_page, source: sourceSummary(scopeGroups, [...endpointsForReport.luaran]) };
  }
  const groups = await repository.bkdGroups(integration);
  let rows: BkdReportRow[] = [];
  let total = 0;
  if (input.id_smt) {
    [rows, total] = await Promise.all([
      repository.bkdRows(integration, input.id_smt, input.simpulan ?? null, input.per_page, (input.page - 1) * input.per_page),
      repository.countBkdRows(integration, input.id_smt, input.simpulan ?? null),
    ]);
  }
  return { kind: input.kind, groups, rows, total, page: input.page, per_page: input.per_page, source: sourceSummary(scopeGroups, [...endpointsForReport.bkd]) };
}

function endpointHref(endpoint: string, idSdm?: string | null, scopeKey?: string) {
  const module = jelajahModules.find((candidate) =>
    candidate.path === endpoint ||
    candidate.detailPath === endpoint ||
    candidate.children?.some((child) => child.path === endpoint),
  );
  if (!module) return "/replika/status";
  if (module.kind === "sdm_object") {
    const path = idSdm ? "/pegawai/" + encodeURIComponent(idSdm) : "/pegawai";
    return path + "?tab=" + encodeURIComponent(module.key);
  }
  const scopedParams = new URLSearchParams(scopeKey && scopeKey !== "-" ? scopeKey : "");
  const params = new URLSearchParams(module.query ?? {});
  if (idSdm) params.set("id_sdm", idSdm);
  for (const [key, value] of scopedParams) {
    if (key !== "id" && key !== "id_sdm") params.set(key, value);
  }
  const detailId = module.detailPath === endpoint ? scopedParams.get("id") : null;
  const path = detailId && module.detailPath
    ? module.detailPath.replace("{id}", encodeURIComponent(detailId))
    : module.path;
  const query = params.toString();
  return path + (query ? "?" + query : "");
}

export async function getBusinessWarnings(repository = new PrismaBusinessReportingRepository()) {
  const integration = integrationId();
  const [groups, issues, runs, bkdGroups] = await Promise.all([
    repository.scopeGroups(integration),
    repository.scopeIssues(integration),
    repository.latestSyncRuns(integration),
    repository.bkdGroups(integration),
  ]);
  const byEndpoint = new Map(groups.map((row) => [row.endpoint, row]));
  const endpoints = replicaEndpointTemplates().map((endpoint) => {
    const group = byEndpoint.get(endpoint);
    const module = jelajahModules.find((candidate) =>
      candidate.path === endpoint || candidate.detailPath === endpoint || candidate.children?.some((child) => child.path === endpoint),
    );
    return {
      endpoint,
      label: module?.label ?? endpoint,
      href: endpointHref(endpoint),
      scope_count: group?.total ?? 0,
      failed_scope_count: group?.failed ?? 0,
      not_found_scope_count: group?.not_found ?? 0,
      oldest_fetch_at: group?.last_fetched_at?.toISOString() ?? null,
      never_synced: !group,
    };
  });
  return {
    endpoints,
    issues_truncated: issues.length > 200,
    issues: issues.slice(0, 200).map((issue) => ({
      ...issue,
      fetched_at: issue.last_fetched_at.toISOString(),
      last_success_at: issue.last_success_at?.toISOString() ?? null,
      href: endpointHref(issue.endpoint, issue.id_sdm, issue.scope_key),
    })),
    bkd: bkdGroups.filter((group) => group.simpulan.toUpperCase() === "T"),
    runs: runs.map((run) => ({
      id: run.id,
      scope: run.scope,
      status: run.status,
      request_count: run.requestCount,
      error_count: run.errorCount,
      started_at: run.startedAt.toISOString(),
      finished_at: run.finishedAt?.toISOString() ?? null,
    })),
  };
}
