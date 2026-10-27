import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/security/audit", () => ({ recordSecurityAuditEvent: vi.fn().mockResolvedValue({ persisted: true }) }));

import type { AppRole } from "@/server/auth/session";
import { appRouter } from "@/server/trpc/router";
import * as service from "./business_service";
import * as reporting from "./business_reporting_service";
import * as live from "@/modules/jelajah/api/jelajah_service";

const marker = { verified: "service-called" };
const modules = vi.spyOn(service, "businessModules").mockReturnValue([]);
const services = [
  vi.spyOn(service, "searchBusinessSdm"),
  vi.spyOn(service, "searchBusinessPrograms"),
  vi.spyOn(service, "getBusinessRows"),
  vi.spyOn(service, "getBusinessDetail"),
  vi.spyOn(service, "getBusinessSemesters"),
  vi.spyOn(reporting, "getBusinessReport"),
  vi.spyOn(reporting, "getBusinessWarnings"),
  vi.spyOn(live, "getJelajahList"),
  vi.spyOn(live, "getJelajahDetail"),
];
for (const mock of services) mock.mockResolvedValue(marker as never);

function caller(role: AppRole | null) {
  return appRouter.createCaller({
    requestId: "business-role-test",
    request: new Request("https://app.test/api/trpc/business"),
    user: role ? { id: "00000000-0000-4000-8000-000000000001", email: "synthetic@example.test", name: "Synthetic", role } : null,
  });
}
const routes = [
  { name: "modules", call: (c: ReturnType<typeof caller>) => c.business.modules() },
  { name: "sdm", call: (c: ReturnType<typeof caller>) => c.business.sdm({}) },
  { name: "program_studies", call: (c: ReturnType<typeof caller>) => c.business.program_studies({}) },
  { name: "rows", call: (c: ReturnType<typeof caller>) => c.business.rows({ module: "penelitian" }) },
  { name: "detail", call: (c: ReturnType<typeof caller>) => c.business.detail({ module: "penelitian", id: "record" }) },
  { name: "semesters", call: (c: ReturnType<typeof caller>) => c.business.semesters({}) },
  { name: "report", call: (c: ReturnType<typeof caller>) => c.business.report({ kind: "sdm" }) },
  { name: "warnings", call: (c: ReturnType<typeof caller>) => c.business.warnings({}) },
  { name: "live_search", call: (c: ReturnType<typeof caller>) => c.business.live_search({ module: "kolaborator_eksternal", search: { nama: "Synthetic" } }) },
  { name: "live_detail", call: (c: ReturnType<typeof caller>) => c.business.live_detail({ module: "kolaborator_eksternal", id: "record" }) },
];

beforeEach(() => {
  modules.mockClear();
  for (const mock of services) mock.mockClear();
});

describe.each(routes)("business.$name direct-call role boundary", ({ call, name }) => {
  it.each([null, "VIEWER", "REVIEWER", "OPERATOR"] as const)("rejects %s before any service or upstream work", async (role) => {
    await expect(call(caller(role))).rejects.toMatchObject({ code: role ? "FORBIDDEN" : "UNAUTHORIZED" });
    expect(modules).not.toHaveBeenCalled();
    for (const mock of services) expect(mock).not.toHaveBeenCalled();
  });

  it("allows ADMIN through the protected boundary", async () => {
    const result = await call(caller("ADMIN"));
    expect(result).toEqual(name === "modules" ? [] : marker);
    expect(modules.mock.calls.length + services.reduce((sum, mock) => sum + mock.mock.calls.length, 0)).toBe(1);
  });
});

it("does not let ADMIN use business live procedures as arbitrary module proxies", async () => {
  await expect(caller("ADMIN").business.live_search({ module: "penelitian" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  await expect(caller("ADMIN").business.live_detail({ module: "penelitian", id: "record" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  expect(live.getJelajahList).not.toHaveBeenCalled();
  expect(live.getJelajahDetail).not.toHaveBeenCalled();
});
