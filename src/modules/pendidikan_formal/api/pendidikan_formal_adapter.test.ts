import { describe, expect, it, vi } from "vitest";

const sisterGetMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/sister/http_client", () => ({
  sisterGet: sisterGetMock,
}));

import {
  FixturePendidikanFormalAdapter,
  SisterPendidikanFormalAdapter,
} from "./pendidikan_formal_adapter";

const idSdm = "8fe6735c-6e28-43e7-9eb3-3ae092bbcd62";
const idPendidikanFormal = "c2f00000-0000-4000-8000-000000000001";

describe("FixturePendidikanFormalAdapter", () => {
  it("returns list and detail for a selected fixture SDM", async () => {
    const adapter = new FixturePendidikanFormalAdapter();

    const list = await adapter.getList({ id_sdm: idSdm });
    const detail = await adapter.getDetail({
      id_pendidikan_formal: idPendidikanFormal,
    });

    expect(list[0]).toMatchObject({
      id: idPendidikanFormal,
      jenjang_pendidikan: "S2",
      tahun_lulus: 2012,
      jenis_ajuan: "",
    });
    expect(detail).toMatchObject({
      id: idPendidikanFormal,
      id_sdm: idSdm,
      nama_program_studi: "Ilmu Komputer",
    });
  });

  it("returns an empty list for a known SDM without education history", async () => {
    const list = await new FixturePendidikanFormalAdapter().getList({
      id_sdm: "d2f2e4c7-0d62-4ef0-8e88-f0af9e6247c5",
    });

    expect(list).toEqual([]);
  });

  it("rejects an unknown education identifier", async () => {
    await expect(
      new FixturePendidikanFormalAdapter().getDetail({
        id_pendidikan_formal: "00000000-0000-4000-8000-000000000099",
      }),
    ).rejects.toThrow("SISTER resource was not found");
  });
});

describe("SisterPendidikanFormalAdapter", () => {
  it("uses only the documented list and detail paths", async () => {
    sisterGetMock.mockResolvedValueOnce([]).mockResolvedValueOnce({});
    const adapter = new SisterPendidikanFormalAdapter();

    await adapter.getList({ id_sdm: idSdm });
    await adapter.getDetail({ id_pendidikan_formal: idPendidikanFormal });

    expect(sisterGetMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        path: "/pendidikan_formal",
        query: { id_sdm: idSdm },
      }),
    );
    expect(sisterGetMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        path: `/pendidikan_formal/${idPendidikanFormal}`,
      }),
    );
    expect(sisterGetMock.mock.calls[1]?.[0]).not.toHaveProperty("query");
  });
});
