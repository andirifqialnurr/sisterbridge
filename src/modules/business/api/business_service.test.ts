import { beforeEach, expect, it, vi } from "vitest";
import { PrismaBusinessRepository } from "../repository/business_repository";
import { businessRowsInputSchema } from "./business_schemas";
import { getBusinessDetail, getBusinessRows } from "./business_service";

vi.mock("@/server/sister/config", () => ({ getSisterConfig: () => ({ integration_id: "integration-test" }) }));
const sdm = "00000000-0000-4000-8000-000000000001";
const source = { endpoint: "/penelitian", scopeKey: "-", itemCount: 2, lastStatus: 200, lastErrorCode: null, lastFetchedAt: new Date(), lastSuccessAt: new Date() };
let repository: PrismaBusinessRepository;
beforeEach(() => {
  repository = new PrismaBusinessRepository();
  vi.spyOn(repository, "listViews").mockResolvedValue([
    { name: "penelitian_list", comment: "SISTER /penelitian (generated)" },
    { name: "penelitian", comment: "SISTER /penelitian/{id} (generated)" },
    { name: "penelitian_bidang_ilmu", comment: null },
    { name: "data_pribadi_bidang_ilmu", comment: null },
    { name: "referensi_sdm", comment: null },
  ]);
  vi.spyOn(repository, "columns").mockResolvedValue([{ name: "judul", dataType: "text" }]);
  vi.spyOn(repository, "rows").mockResolvedValue([{ id: "record", judul: "Penelitian", r_id_sdm: sdm, r_item_key: "record", r_scope_key: "id_sdm=one", owner_name: "SDM uji" }]);
  vi.spyOn(repository, "count").mockResolvedValue(2);
  vi.spyOn(repository, "scope").mockResolvedValue(source);
  vi.spyOn(repository, "scopeSummary").mockResolvedValue({ ...source, scopeCount: 97, failedScopeCount: 1 });
});

it("loads all SDM with tenant isolation, pagination, owner context, and partial status", async () => {
  const result = await getBusinessRows(businessRowsInputSchema.parse({ module: "penelitian", page: 2 }), repository);
  expect(repository.rows).toHaveBeenCalledWith("penelitian_list", { integrationId: "integration-test", includeSdm: true, semester: undefined }, 20, 20, "");
  expect(result.rows[0]).toMatchObject({ id_sdm: sdm, nama_sdm: "SDM uji", row_key: "id_sdm=one:record" });
  expect(result.source).toMatchObject({ failed_scope_count: 1, scope_count: 97 });
});

it("keeps selected SDM filtering and rejects unknown SDM", async () => {
  await getBusinessRows(businessRowsInputSchema.parse({ module: "penelitian", id_sdm: sdm }), repository);
  expect(repository.rows).toHaveBeenLastCalledWith("penelitian_list", { integrationId: "integration-test", idSdm: sdm, scopeKey: `id_sdm=${sdm}` }, 20, 0, "");
  vi.mocked(repository.rows).mockResolvedValue([]);
  await expect(getBusinessRows(businessRowsInputSchema.parse({ module: "penelitian", id_sdm: sdm }), repository)).rejects.toThrow("SDM tidak ditemukan");
});

it("reads shared details by parent only after proving membership in the selected SDM list", async () => {
  await getBusinessDetail({ module: "penelitian", id: "record", id_sdm: sdm }, repository);
  expect(repository.rows).toHaveBeenCalledWith("penelitian_list", { integrationId: "integration-test", idSdm: sdm, scopeKey: `id_sdm=${sdm}`, itemKey: "record" }, 1);
  expect(repository.rows).toHaveBeenCalledWith("penelitian", { integrationId: "integration-test", parentId: "record" }, 1);
  vi.mocked(repository.rows).mockImplementation(async (view) => view === "referensi_sdm" ? [{ id_sdm: sdm }] : []);
  await expect(getBusinessDetail({ module: "penelitian", id: "not-owned", id_sdm: sdm }, repository)).rejects.toThrow("Data tidak ditemukan");
});

it("does not truncate multiple personal fields of study to one row", async () => {
  await getBusinessRows(businessRowsInputSchema.parse({ module: "bidang_ilmu_sdm", id_sdm: sdm, page: 2 }), repository);
  expect(repository.rows).toHaveBeenCalledWith("data_pribadi_bidang_ilmu", { integrationId: "integration-test", idSdm: sdm, scopeKey: `id_sdm=${sdm}` }, 20, 20, "");
});

it("allows the last DUDI page past page 1000", () => {
  expect(businessRowsInputSchema.parse({ module: "ref_dudi", page: 2167 }).page).toBe(2167);
});
