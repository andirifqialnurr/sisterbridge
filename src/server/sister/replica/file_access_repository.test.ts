import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const config = vi.hoisted(() => vi.fn());
vi.mock("@/server/sister/config", () => ({ getSisterConfig: config }));

import { hasSisterFileAccess } from "./file_access_repository";

const integrationId = "22222222-3333-4444-8555-000000000001";
const id = "33333333-3333-4333-8333-333333333333";
const idSdm = "44444444-4444-4444-8444-444444444444";

function repository() {
  const findFirst = vi.fn();
  const query = vi.fn().mockResolvedValue([{ allowed: false }]);
  const client = { sisterReplicaRecord: { findFirst }, $queryRawUnsafe: query } as unknown as Pick<PrismaClient, "sisterReplicaRecord" | "$queryRawUnsafe">;
  return { client, findFirst, query };
}

beforeEach(() => {
  config.mockReturnValue({ integration_id: integrationId, fixture_mode: false });
});

describe("SISTER file ownership repository", () => {
  it("allows photos only for active SDM in the configured integration", async () => {
    const { client, findFirst } = repository();
    findFirst.mockResolvedValue({ itemKey: idSdm });
    expect(await hasSisterFileAccess("foto", idSdm, client)).toBe(true);
    expect(findFirst).toHaveBeenCalledExactlyOnceWith({
      where: { integrationId, endpoint: "/referensi/sdm", scopeKey: "-", itemKey: idSdm, deletedAt: null },
      select: { itemKey: true },
    });
  });

  it("uses any active canonical metadata owner in one integration-scoped query", async () => {
    const { client, findFirst, query } = repository();
    query.mockResolvedValueOnce([{ allowed: true }]);
    expect(await hasSisterFileAccess("dokumen", id, client)).toBe(true);
    expect(findFirst).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledExactlyOnceWith(expect.any(String), integrationId, id);
    const sql = query.mock.calls[0][0] as string;
    expect(sql).toContain("SELECT EXISTS");
    expect(sql).toContain("s.integration_id=d.integration_id");
    expect(sql).toContain("s.item_key=d.id_sdm AND s.deleted_at IS NULL");
    expect(sql).toContain("d.integration_id=$1::uuid");
    expect(sql).toContain("d.deleted_at IS NULL AND d.scope_key='id_sdm='||d.id_sdm");
    expect(sql).not.toContain("LIMIT");
    expect(sql).not.toContain(id);
  });

  it.each([{ rows: [] }, { rows: [{ allowed: false }] }, { rows: [{ allowed: null }] }, { rows: [{ allowed: "true" }] }])("denies documents without a positive ownership proof: $rows", async ({ rows }) => {
    const { client, findFirst, query } = repository();
    query.mockResolvedValue(rows);
    expect(await hasSisterFileAccess("dokumen", id, client)).toBe(false);
    expect(findFirst).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("denies photos when the SDM is absent or retired", async () => {
    const { client, findFirst, query } = repository();
    findFirst.mockResolvedValueOnce(null);
    expect(await hasSisterFileAccess("foto", id, client)).toBe(false);
    expect(query).not.toHaveBeenCalled();
  });

  it.each([
    { integration_id: null, fixture_mode: false },
    { integration_id: integrationId, fixture_mode: true },
  ])("denies access without live integration configuration: %j", async (value) => {
    config.mockReturnValue(value);
    const { client, findFirst, query } = repository();
    for (const kind of ["foto", "dokumen"] as const) expect(await hasSisterFileAccess(kind, id, client)).toBe(false);
    expect(findFirst).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it("permits class documents only through a single own-PT profile and active teaching chain", async () => {
    const { client, findFirst, query } = repository();
    findFirst.mockResolvedValue(null);
    query.mockResolvedValueOnce([{ allowed: false }]).mockResolvedValueOnce([{ allowed: true }]);
    expect(await hasSisterFileAccess("dokumen", id, client)).toBe(true);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenNthCalledWith(2, expect.any(String), integrationId, id);
    const sql = query.mock.calls[1][0] as string;
    expect(sql).toContain("d.payload_json->>'id_pt'=pt.id");
    expect(sql).toContain("d.payload_json->>'id_kelas'=c.parent_id");
    expect(sql).toContain("p.item_key=d.parent_id");
    expect(sql).toContain("s.item_key=p.id_sdm");
    expect(sql).toContain("(SELECT count(*) FROM own_pt)=1");
    expect(sql).toContain("c.deleted_at IS NULL");
    expect(sql).toContain("c.integration_id=$1::uuid");
  });

  it("uses only explicit document-array fields on allowlisted active detail parents", async () => {
    const { client, findFirst, query } = repository();
    findFirst.mockResolvedValue(null);
    query.mockResolvedValueOnce([{ allowed: false }]).mockResolvedValueOnce([{ allowed: false }]).mockResolvedValueOnce([{ allowed: true }]);
    expect(await hasSisterFileAccess("dokumen", id, client)).toBe(true);
    const [sql, integration, endpoints, byId, byDocumentId] = query.mock.calls[2];
    expect(integration).toBe(integrationId);
    expect(endpoints).toContain("/penelitian/{id}");
    expect(endpoints).not.toContain("/pengajaran/{id}");
    expect(endpoints).not.toContain("/kelas_kuliah/{id}/dokumen");
    expect(JSON.parse(byId)).toEqual({ dokumen: [{ id }] });
    expect(JSON.parse(byDocumentId)).toEqual({ dokumen: [{ id_dokumen: id }] });
    expect(sql).toContain("d.endpoint=ANY($2::text[])");
    expect(sql).toContain("p.item_key=d.parent_id AND p.deleted_at IS NULL");
    expect(sql).toContain("s.item_key=p.id_sdm AND s.deleted_at IS NULL");
    expect(sql).not.toContain(id);
  });

  it("propagates ownership SQL failures instead of pretending the document is absent", async () => {
    const { client, findFirst, query } = repository();
    findFirst.mockResolvedValue(null);
    query.mockRejectedValue(new Error("database unavailable"));
    await expect(hasSisterFileAccess("dokumen", id, client)).rejects.toThrow("database unavailable");
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("propagates storage failures so the route can return service unavailable", async () => {
    const { client, findFirst } = repository();
    findFirst.mockRejectedValue(new Error("database unavailable"));
    await expect(hasSisterFileAccess("foto", id, client)).rejects.toThrow("database unavailable");
  });
});
