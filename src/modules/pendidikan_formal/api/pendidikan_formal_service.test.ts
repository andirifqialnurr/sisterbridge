import { afterEach, describe, expect, it } from "vitest";

import { FixturePendidikanFormalAdapter } from "./pendidikan_formal_adapter";
import {
  getPendidikanFormalDetail,
  getPendidikanFormalList,
} from "./pendidikan_formal_service";

const idSdm = "8fe6735c-6e28-43e7-9eb3-3ae092bbcd62";
const idPendidikanFormal = "c2f00000-0000-4000-8000-000000000001";
const originalFixtureMode = process.env.SISTER_FIXTURE_MODE;

afterEach(() => {
  if (originalFixtureMode === undefined) {
    delete process.env.SISTER_FIXTURE_MODE;
  } else {
    process.env.SISTER_FIXTURE_MODE = originalFixtureMode;
  }
});

describe("Pendidikan formal service", () => {
  it("returns only documented list fields", async () => {
    process.env.SISTER_FIXTURE_MODE = "true";

    const result = await getPendidikanFormalList(
      { id_sdm: idSdm },
      new FixturePendidikanFormalAdapter(),
    );

    expect(result.source).toBe("fixture");
    expect(result.items[0]).toEqual({
      id: idPendidikanFormal,
      jenjang_pendidikan: "S2",
      gelar_akademik: "Magister Komputer",
      bidang_studi: "Ilmu Komputer",
      nama_perguruan_tinggi: "Perguruan Tinggi Fixture",
      tahun_lulus: 2012,
      jenis_ajuan: "",
    });
  });

  it("keeps detail documents inside the documented detail DTO", async () => {
    process.env.SISTER_FIXTURE_MODE = "true";

    const result = await getPendidikanFormalDetail(
      { id_pendidikan_formal: idPendidikanFormal },
      new FixturePendidikanFormalAdapter(),
    );

    expect(result.item).toMatchObject({
      id: idPendidikanFormal,
      id_sdm: idSdm,
      jumlah_sks: 42,
      dokumen: [{ jenis_file: "application/pdf" }],
    });
    expect(result.item).not.toHaveProperty("source");
  });
});
