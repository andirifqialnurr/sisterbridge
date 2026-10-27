import { expect, it, vi } from "vitest";
import { PrismaBusinessReportingRepository } from "../repository/business_reporting_repository";
import { getBusinessReport, getBusinessWarnings } from "./business_reporting_service";
import { businessReportInputSchema } from "./business_schemas";

vi.mock("@/server/sister/config", () => ({ getSisterConfig: () => ({ integration_id: "integration-test" }) }));

it("preserves partial source status and shared-activity units in output drilldowns", async () => {
  const repository = new PrismaBusinessReportingRepository();
  vi.spyOn(repository, "scopeGroups").mockResolvedValue([
    { endpoint: "/publikasi", total: 98, failed: 2, not_found: 1, last_fetched_at: new Date("2026-10-26T00:00:00Z") },
  ]);
  vi.spyOn(repository, "outputGroups").mockResolvedValue([{ module: "publikasi", tahun: 2026, total: 25, participations: 72 }]);
  vi.spyOn(repository, "outputRows").mockResolvedValue([{ id: "activity", id_sdm: "owner", judul: "Synthetic activity", nama_sdm: "Synthetic owner", owner_available: true, tahun: 2026 }]);
  vi.spyOn(repository, "countOutputRows").mockResolvedValue(25);
  const result = await getBusinessReport(businessReportInputSchema.parse({ kind: "luaran", module: "publikasi", tahun: 2026, page: 2, per_page: 20 }), repository);
  expect(repository.outputRows).toHaveBeenCalledWith("integration-test", "publikasi", 2026, 20, 20);
  expect(result).toMatchObject({ total: 25, page: 2, groups: [{ total: 25, participations: 72 }], rows: [{ judul: "Synthetic activity", nama_sdm: "Synthetic owner" }], source: { failed_scope_count: 2, not_found_scope_count: 1, scope_count: 98 } });
});

it("does not fetch unfiltered output records before a module and year are chosen", async () => {
  const repository = new PrismaBusinessReportingRepository();
  vi.spyOn(repository, "scopeGroups").mockResolvedValue([]);
  vi.spyOn(repository, "outputGroups").mockResolvedValue([]);
  const rows = vi.spyOn(repository, "outputRows");
  const result = await getBusinessReport(businessReportInputSchema.parse({ kind: "luaran" }), repository);
  expect(result.rows).toEqual([]);
  expect(rows).not.toHaveBeenCalled();
});

it("pages all warning scopes rather than silently cutting off at 200", async () => {
  const repository = new PrismaBusinessReportingRepository();
  vi.spyOn(repository, "scopeGroups").mockResolvedValue([]);
  vi.spyOn(repository, "scopeIssues").mockResolvedValue([]);
  vi.spyOn(repository, "countScopeIssues").mockResolvedValue(1234);
  vi.spyOn(repository, "latestSyncRuns").mockResolvedValue([]);
  vi.spyOn(repository, "bkdGroups").mockResolvedValue([]);
  const result = await getBusinessWarnings({ page: 11, per_page: 20 }, repository);
  expect(repository.scopeIssues).toHaveBeenCalledWith("integration-test", 20, 200);
  expect(result).toMatchObject({ issues_total: 1234, issues_truncated: false, page: 11, per_page: 20 });
});
