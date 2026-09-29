import { describe, expect, it } from "vitest";

import {
  perguruanTinggiListSchema,
  profilPtListSchema,
  semesterListSchema,
  unitKerjaListSchema,
  wilayahListSchema,
} from "@/server/sister/types";

import {
  referensiPerguruanTinggiItemSchema,
  referensiProfilPtItemSchema,
  referensiSemesterItemSchema,
  referensiUnitKerjaInputSchema,
  referensiUnitKerjaItemSchema,
  referensiWilayahInputSchema,
  referensiWilayahItemSchema,
} from "./referensi_schemas";

const profilPt = {
  id: "pt-1",
  kode_perguruan_tinggi: "123456",
  nama_perguruan_tinggi: "Perguruan Tinggi Uji",
  telepon: "021000000",
  faximile: "021000001",
  email: "pt@example.test",
  website: "https://example.test",
  jalan: "Jalan Uji",
  dusun: "Dusun Uji",
  rt: 1,
  rw: 2,
  kelurahan: "Kelurahan Uji",
  kode_pos: "12345",
  id_wilayah: "010101",
};

describe("SISTER referensi schemas", () => {
  it("accepts the documented PT response types", () => {
    expect(profilPtListSchema.safeParse([profilPt]).success).toBe(true);
    expect(referensiProfilPtItemSchema.parse(profilPt)).toEqual(profilPt);
  });

  it("normalizes the live PT response and rejects non-numeric RT and extra DTO fields", () => {
    // Live SISTER returns one object keyed by id_perguruan_tinggi, with nulls.
    const { id, ...rest } = profilPt;
    expect(
      profilPtListSchema.parse({ ...rest, id_perguruan_tinggi: id, rt: "1", jalan: null })[0],
    ).toMatchObject({ id, rt: 1, jalan: "" });
    expect(profilPtListSchema.parse({})).toEqual([]);
    expect(
      profilPtListSchema.safeParse([{ ...profilPt, rt: "satu" }]).success,
    ).toBe(false);
    expect(
      referensiProfilPtItemSchema.safeParse({ ...profilPt, undocumented: "x" }).success,
    ).toBe(false);
  });

  it("accepts integer semester IDs and rejects non-integer IDs", () => {
    expect(semesterListSchema.safeParse([{ id: 20251, nama: "Ganjil" }]).success).toBe(true);
    expect(referensiSemesterItemSchema.parse({ id: 20251, nama: "Ganjil" })).toEqual({
      id: 20251,
      nama: "Ganjil",
    });
    expect(semesterListSchema.safeParse([{ id: "20251", nama: "Ganjil" }]).success).toBe(false);
    expect(
      referensiSemesterItemSchema.safeParse({ id: 20251, nama: "Ganjil", extra: true }).success,
    ).toBe(false);
  });

  it("accepts the documented wilayah response and only the four allowed levels", () => {
    const wilayah = { id: "32", nama: "Jawa Barat", id_induk_wilayah: "ID" };

    expect(wilayahListSchema.safeParse([wilayah]).success).toBe(true);
    expect(referensiWilayahItemSchema.parse(wilayah)).toEqual(wilayah);
    expect(
      referensiWilayahItemSchema.safeParse({ ...wilayah, undocumented: "x" }).success,
    ).toBe(false);

    for (const level of [0, 1, 2, 3]) {
      expect(referensiWilayahInputSchema.safeParse({ id_level_wilayah: level }).success).toBe(true);
    }
    expect(referensiWilayahInputSchema.safeParse({ id_level_wilayah: 4 }).success).toBe(false);
    expect(referensiWilayahInputSchema.safeParse({ id_level_wilayah: "1" }).success).toBe(false);
  });

  it("accepts the documented perguruan_tinggi and unit_kerja responses", () => {
    const perguruanTinggi = { id: "11111111-1111-4111-8111-111111111111", nama: "PT Uji" };
    const unitKerja = { id: "unit-1", nama: "Fakultas Uji", id_jenis_unit: 1 };

    expect(perguruanTinggiListSchema.safeParse([perguruanTinggi]).success).toBe(true);
    expect(referensiPerguruanTinggiItemSchema.parse(perguruanTinggi)).toEqual(perguruanTinggi);

    expect(unitKerjaListSchema.safeParse([unitKerja]).success).toBe(true);
    expect(referensiUnitKerjaItemSchema.parse(unitKerja)).toEqual(unitKerja);
    expect(unitKerjaListSchema.safeParse([{ ...unitKerja, id_jenis_unit: 9 }]).success).toBe(
      false,
    );
    expect(
      referensiUnitKerjaItemSchema.safeParse({ ...unitKerja, undocumented: "x" }).success,
    ).toBe(false);
  });

  it("requires id_perguruan_tinggi to be a UUID for the unit_kerja query", () => {
    expect(
      referensiUnitKerjaInputSchema.safeParse({
        id_perguruan_tinggi: "11111111-1111-4111-8111-111111111111",
      }).success,
    ).toBe(true);
    expect(
      referensiUnitKerjaInputSchema.safeParse({ id_perguruan_tinggi: "not-a-uuid" }).success,
    ).toBe(false);
  });
});
