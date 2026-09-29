import { describe, expect, it } from "vitest";

import {
  pendidikanFormalDetailResponseSchema,
  pendidikanFormalIdInputSchema,
  pendidikanFormalListResponseSchema,
  pendidikanFormalSdmInputSchema,
} from "./pendidikan_formal_schemas";

const idSdm = "8fe6735c-6e28-43e7-9eb3-3ae092bbcd62";
const idPendidikanFormal = "c2f00000-0000-4000-8000-000000000001";
const fetchedAt = "2026-09-17T00:00:00.000Z";

const summary = {
  id: idPendidikanFormal,
  jenjang_pendidikan: "S2",
  gelar_akademik: "Magister Komputer",
  bidang_studi: "Ilmu Komputer",
  nama_perguruan_tinggi: "Perguruan Tinggi Fixture",
  tahun_lulus: 2012,
  jenis_ajuan: "0",
};

const detail = {
  ...summary,
  jenis_ajuan: "Baru",
  kategori_kegiatan: "Pendidikan formal",
  id_sdm: idSdm,
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
};

describe("Pendidikan formal schemas", () => {
  it("validates documented SDM and education identifiers", () => {
    expect(pendidikanFormalSdmInputSchema.parse({ id_sdm: idSdm })).toEqual({ id_sdm: idSdm });
    expect(
      pendidikanFormalIdInputSchema.parse({ id_pendidikan_formal: idPendidikanFormal }),
    ).toEqual({ id_pendidikan_formal: idPendidikanFormal });
    expect(
      pendidikanFormalIdInputSchema.safeParse({ id_pendidikan_formal: "not-a-uuid" }).success,
    ).toBe(false);
  });

  it("keeps list and detail response types aligned with the PDF", () => {
    expect(
      pendidikanFormalListResponseSchema.parse({
        items: [summary],
        source: "fixture",
        fetched_at: fetchedAt,
      }),
    ).toMatchObject({ items: [summary], source: "fixture" });

    expect(
      pendidikanFormalDetailResponseSchema.parse({
        item: detail,
        source: "fixture",
        fetched_at: fetchedAt,
      }),
    ).toMatchObject({ item: { id: idPendidikanFormal, dokumen: detail.dokumen } });
  });

  it("accepts nullable document link and description metadata", () => {
    const result = pendidikanFormalDetailResponseSchema.parse({
      item: {
        ...detail,
        dokumen: detail.dokumen.map((document) => ({
          ...document,
          tautan: null,
          keterangan: null,
        })),
      },
      source: "sister",
      fetched_at: fetchedAt,
    });

    expect(result.item.dokumen[0]).toMatchObject({
      tautan: null,
      keterangan: null,
    });
  });

  it("rejects undocumented fields from the UI DTO", () => {
    const result = pendidikanFormalDetailResponseSchema.safeParse({
      item: { ...detail, internal_note: "must not pass" },
      source: "fixture",
      fetched_at: fetchedAt,
    });

    expect(result.success).toBe(false);
  });
});
