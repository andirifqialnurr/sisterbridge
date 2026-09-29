import { SisterApiError, SisterNotFoundError } from "@/server/sister/errors";
import { sisterGet } from "@/server/sister/http_client";
import {
  bkdActivityListSchema,
  bkdLaporanAkhirListSchema,
  type BkdActivity,
  type BkdLaporanAkhir,
} from "@/server/sister/types";

import type { BkdSemesterInput, BkdSdmInput } from "./bkd_schemas";

export type BkdDataSource = {
  getLaporanAkhir(input: BkdSdmInput): Promise<BkdLaporanAkhir[]>;
  getPendidikan(input: BkdSemesterInput): Promise<BkdActivity[]>;
  getAjar(input: BkdSemesterInput): Promise<BkdActivity[]>;
  getTunjang(input: BkdSemesterInput): Promise<BkdActivity[]>;
  getPengmas(input: BkdSemesterInput): Promise<BkdActivity[]>;
  getPenelitian(input: BkdSemesterInput): Promise<BkdActivity[]>;
};

const fixtureSdm = {
  "8fe6735c-6e28-43e7-9eb3-3ae092bbcd62": {
    nama: "Aditya Pratama",
    nidn: "032999923",
  },
  "4d1f0f7f-8f4f-4b12-9f40-73cc3ca6ed3b": {
    nama: "Siti Rahmawati",
    nidn: "0412058501",
  },
  "d2f2e4c7-0d62-4ef0-8e88-f0af9e6247c5": {
    nama: "Bima Kurniawan",
    nidn: "0317019002",
  },
} as const;

const fixtureLaporanAkhir: Record<string, BkdLaporanAkhir[]> = {
  "8fe6735c-6e28-43e7-9eb3-3ae092bbcd62": [
    {
      id_reg_ptk: "a1f00000-0000-4000-8000-000000000001",
      id_smt: "20251",
      sks_kinerja_ajar: 6,
      sks_lebih_ajar: 0,
      sks_kinerja_didik: 2,
      sks_lebih_didik: 0,
      sks_kinerja_lit: 2,
      sks_lebih_lit: 0,
      sks_kinerja_pengmas: 1,
      sks_lebih_pengmas: 0,
      sks_kinerja_penunjang: 1,
      sks_lebih_tunjang: 0,
      sks_kinerja: 12,
      sks_lebih: 0,
      stat_kewajiban: 1,
      stat_tugas: "Memenuhi",
      stat_belajar: "Aktif",
      id_jabfung: 1,
      simpulan_asesor: "Memenuhi kewajiban BKD",
    },
  ],
  "4d1f0f7f-8f4f-4b12-9f40-73cc3ca6ed3b": [
    {
      id_reg_ptk: "a1f00000-0000-4000-8000-000000000002",
      id_smt: "20251",
      sks_kinerja_ajar: 4,
      sks_lebih_ajar: 0,
      sks_kinerja_didik: 2,
      sks_lebih_didik: 0,
      sks_kinerja_lit: 0,
      sks_lebih_lit: 0,
      sks_kinerja_pengmas: 0,
      sks_lebih_pengmas: 0,
      sks_kinerja_penunjang: 2,
      sks_lebih_tunjang: 0,
      sks_kinerja: 8,
      sks_lebih: 0,
      stat_kewajiban: 1,
      stat_tugas: "Memenuhi",
      stat_belajar: "Aktif",
      id_jabfung: 0,
      simpulan_asesor: "Memenuhi kewajiban BKD",
    },
  ],
  "d2f2e4c7-0d62-4ef0-8e88-f0af9e6247c5": [
    {
      id_reg_ptk: "a1f00000-0000-4000-8000-000000000003",
      id_smt: "20251",
      sks_kinerja_ajar: 6,
      sks_lebih_ajar: 1,
      sks_kinerja_didik: 2,
      sks_lebih_didik: 0,
      sks_kinerja_lit: 3,
      sks_lebih_lit: 0,
      sks_kinerja_pengmas: 1,
      sks_lebih_pengmas: 0,
      sks_kinerja_penunjang: 1,
      sks_lebih_tunjang: 0,
      sks_kinerja: 13,
      sks_lebih: 1,
      stat_kewajiban: 1,
      stat_tugas: "Memenuhi",
      stat_belajar: "Aktif",
      id_jabfung: 2,
      simpulan_asesor: "Memenuhi kewajiban BKD",
    },
  ],
};

const fixtureActivityLabels = {
  pendidikan: { unsur: "Pendidikan", category: "Pendidikan Fixture", id: 1 },
  ajar: { unsur: "Pengajaran", category: "Pengajaran Fixture", id: 2 },
  tunjang: { unsur: "Penunjang", category: "Penunjang Fixture", id: 3 },
  pengmas: { unsur: "Pengabdian", category: "Pengabdian Fixture", id: 4 },
  penelitian: { unsur: "Penelitian", category: "Penelitian Fixture", id: 5 },
} as const;

function getFixtureSdm(idSdm: string) {
  const sdm = fixtureSdm[idSdm as keyof typeof fixtureSdm];
  if (!sdm) {
    throw new SisterNotFoundError();
  }

  return sdm;
}

function getFixtureActivity(
  input: BkdSemesterInput,
  activity: keyof typeof fixtureActivityLabels,
) {
  const sdm = getFixtureSdm(input.id_sdm);
  const label = fixtureActivityLabels[activity];

  return [
    {
      nm_sdm: sdm.nama,
      nidn: sdm.nidn,
      id_smt: input.id_smt,
      unsur: label.unsur,
      judul_keg: `${label.category} untuk ${sdm.nama}`,
      id_katgiat: label.id,
      nm_kat: label.category,
      beban_sks: 2,
      nilai: 2,
    },
  ];
}

export class FixtureBkdAdapter implements BkdDataSource {
  async getLaporanAkhir(input: BkdSdmInput) {
    getFixtureSdm(input.id_sdm);
    return fixtureLaporanAkhir[input.id_sdm] ?? [];
  }

  async getPendidikan(input: BkdSemesterInput) {
    return getFixtureActivity(input, "pendidikan");
  }

  async getAjar(input: BkdSemesterInput) {
    return getFixtureActivity(input, "ajar");
  }

  async getTunjang(input: BkdSemesterInput) {
    return getFixtureActivity(input, "tunjang");
  }

  async getPengmas(input: BkdSemesterInput) {
    return getFixtureActivity(input, "pengmas");
  }

  async getPenelitian(input: BkdSemesterInput) {
    return getFixtureActivity(input, "penelitian");
  }
}

// SISTER answers 404 (not an empty array) when a SDM has no BKD rows for the
// requested semester; the UI treats that as an empty list.
async function sisterGetBkdList<T>(options: Parameters<typeof sisterGet<T[]>>[0]) {
  try {
    return await sisterGet(options);
  } catch (error) {
    if (error instanceof SisterApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

function activityQuery(input: BkdSemesterInput) {
  return { id_sdm: input.id_sdm, id_smt: input.id_smt };
}

export class SisterBkdAdapter implements BkdDataSource {
  async getLaporanAkhir(input: BkdSdmInput) {
    return sisterGetBkdList({
      path: "/bkd/laporan_akhir_bkd",
      query: { id_sdm: input.id_sdm },
      schema: bkdLaporanAkhirListSchema,
    });
  }

  async getPendidikan(input: BkdSemesterInput) {
    return sisterGetBkdList({
      path: "/bkd/pendidikan",
      query: activityQuery(input),
      schema: bkdActivityListSchema,
    });
  }

  async getAjar(input: BkdSemesterInput) {
    return sisterGetBkdList({
      path: "/bkd/ajar",
      query: activityQuery(input),
      schema: bkdActivityListSchema,
    });
  }

  async getTunjang(input: BkdSemesterInput) {
    return sisterGetBkdList({
      path: "/bkd/tunjang",
      query: activityQuery(input),
      schema: bkdActivityListSchema,
    });
  }

  async getPengmas(input: BkdSemesterInput) {
    return sisterGetBkdList({
      path: "/bkd/pengmas",
      query: activityQuery(input),
      schema: bkdActivityListSchema,
    });
  }

  async getPenelitian(input: BkdSemesterInput) {
    return sisterGetBkdList({
      path: "/bkd/penelitian",
      query: activityQuery(input),
      schema: bkdActivityListSchema,
    });
  }
}
