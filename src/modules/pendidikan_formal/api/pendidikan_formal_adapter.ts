import { SisterNotFoundError } from "@/server/sister/errors";
import { sisterGet } from "@/server/sister/http_client";
import {
  pendidikanFormalDetailSchema,
  pendidikanFormalSummaryListSchema,
  type PendidikanFormalDetail,
  type PendidikanFormalSummary,
} from "@/server/sister/types";

import type {
  PendidikanFormalIdInput,
  PendidikanFormalSdmInput,
} from "./pendidikan_formal_schemas";

export type PendidikanFormalDataSource = {
  getList(input: PendidikanFormalSdmInput): Promise<PendidikanFormalSummary[]>;
  getDetail(input: PendidikanFormalIdInput): Promise<PendidikanFormalDetail>;
};

const fixtureSdmIds = new Set([
  "8fe6735c-6e28-43e7-9eb3-3ae092bbcd62",
  "4d1f0f7f-8f4f-4b12-9f40-73cc3ca6ed3b",
  "d2f2e4c7-0d62-4ef0-8e88-f0af9e6247c5",
]);

const fixtureSummaries: Record<string, PendidikanFormalSummary[]> = {
  "8fe6735c-6e28-43e7-9eb3-3ae092bbcd62": [
    {
      id: "c2f00000-0000-4000-8000-000000000001",
      jenjang_pendidikan: "S2",
      gelar_akademik: "Magister Komputer",
      bidang_studi: "Ilmu Komputer",
      nama_perguruan_tinggi: "Perguruan Tinggi Fixture",
      tahun_lulus: 2012,
      jenis_ajuan: "",
    },
  ],
  "4d1f0f7f-8f4f-4b12-9f40-73cc3ca6ed3b": [
    {
      id: "c2f00000-0000-4000-8000-000000000002",
      jenjang_pendidikan: "S1",
      gelar_akademik: "Sarjana Ekonomi",
      bidang_studi: "Manajemen",
      nama_perguruan_tinggi: "Perguruan Tinggi Fixture",
      tahun_lulus: 2010,
      jenis_ajuan: "",
    },
  ],
  "d2f2e4c7-0d62-4ef0-8e88-f0af9e6247c5": [],
};

const fixtureDetails: Record<string, PendidikanFormalDetail> = {
  "c2f00000-0000-4000-8000-000000000001": {
    id: "c2f00000-0000-4000-8000-000000000001",
    jenjang_pendidikan: "S2",
    gelar_akademik: "Magister Komputer",
    bidang_studi: "Ilmu Komputer",
    nama_perguruan_tinggi: "Perguruan Tinggi Fixture",
    tahun_lulus: 2012,
    jenis_ajuan: "Baru",
    kategori_kegiatan: "Pendidikan formal",
    id_sdm: "8fe6735c-6e28-43e7-9eb3-3ae092bbcd62",
    id_program_studi: "fixture-program-studi-ilmu-komputer",
    nama_program_studi: "Ilmu Komputer",
    id_jenjang_pendidikan: 2,
    id_gelar_akademik: 2,
    id_bidang_studi: 1,
    tahun_masuk: 2010,
    tanggal_lulus: "2012-09-15",
    nomor_induk: "201001001",
    jumlah_semester: 4,
    jumlah_sks: 42,
    ipk: 3.65,
    sk_penyetaraan: "",
    tanggal_sk_penyetaraan: "",
    nomor_ijazah: "IJZ/FIXTURE/001",
    judul_tugas_akhir: "Implementasi Sistem Informasi Perguruan Tinggi",
    dokumen: [
      {
        id: "d2f00000-0000-4000-8000-000000000001",
        nama: "Ijazah Magister",
        jenis_dokumen: "Ijazah",
        nama_file: "ijazah-magister-fixture.pdf",
        jenis_file: "application/pdf",
        tanggal_upload: "2026-09-17T00:00:00.000Z",
        tautan: "",
        keterangan: "Dokumen fixture untuk development",
      },
    ],
  },
  "c2f00000-0000-4000-8000-000000000002": {
    id: "c2f00000-0000-4000-8000-000000000002",
    jenjang_pendidikan: "S1",
    gelar_akademik: "Sarjana Ekonomi",
    bidang_studi: "Manajemen",
    nama_perguruan_tinggi: "Perguruan Tinggi Fixture",
    tahun_lulus: 2010,
    jenis_ajuan: "Baru",
    kategori_kegiatan: "Pendidikan formal",
    id_sdm: "4d1f0f7f-8f4f-4b12-9f40-73cc3ca6ed3b",
    id_program_studi: "fixture-program-studi-manajemen",
    nama_program_studi: "Manajemen",
    id_jenjang_pendidikan: 1,
    id_gelar_akademik: 1,
    id_bidang_studi: 2,
    tahun_masuk: 2006,
    tanggal_lulus: "2010-08-20",
    nomor_induk: "200601002",
    jumlah_semester: 8,
    jumlah_sks: 144,
    ipk: 3.48,
    sk_penyetaraan: "",
    tanggal_sk_penyetaraan: "",
    nomor_ijazah: "IJZ/FIXTURE/002",
    judul_tugas_akhir: "Analisis Kinerja Organisasi Pendidikan",
    dokumen: [],
  },
};

export class FixturePendidikanFormalAdapter implements PendidikanFormalDataSource {
  async getList(input: PendidikanFormalSdmInput) {
    if (!fixtureSdmIds.has(input.id_sdm)) {
      throw new SisterNotFoundError();
    }

    return fixtureSummaries[input.id_sdm] ?? [];
  }

  async getDetail(input: PendidikanFormalIdInput) {
    const detail = fixtureDetails[input.id_pendidikan_formal];
    if (!detail) {
      throw new SisterNotFoundError();
    }

    return detail;
  }
}

export class SisterPendidikanFormalAdapter implements PendidikanFormalDataSource {
  async getList(input: PendidikanFormalSdmInput) {
    return sisterGet({
      path: "/pendidikan_formal",
      query: { id_sdm: input.id_sdm },
      schema: pendidikanFormalSummaryListSchema,
    });
  }

  async getDetail(input: PendidikanFormalIdInput) {
    return sisterGet({
      path: `/pendidikan_formal/${encodeURIComponent(input.id_pendidikan_formal)}`,
      schema: pendidikanFormalDetailSchema,
    });
  }
}
