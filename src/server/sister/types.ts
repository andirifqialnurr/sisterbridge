import { z } from "zod";

const nullableText = z.string().nullable().optional().transform((value) => value ?? null);

// Live SISTER responses deviate from the PDF contract: many documented
// strings arrive as null, and many documented numbers arrive as numeric
// strings ("9.5000"). These helpers accept the observed shapes and normalize
// them; they are idempotent so DTO schemas can re-parse the output.
// `text` maps null/missing to "" so the UI shows its "tidak tersedia" state.
const text = z.string().nullable().optional().transform((value) => value ?? "");
const numericString = z
  .string()
  .trim()
  .regex(/^-?\d+(\.\d+)?$/)
  .transform(Number);
const numeric = z.union([z.number(), numericString]);
const nullableNumeric = z
  .union([z.number(), numericString, z.literal("")])
  .nullable()
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Some list endpoints answer with a bare object (`/referensi/profil_pt`) or
// `{}` when empty (`/referensi/perguruan_tinggi`) instead of an array.
function asArray(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }
  if (isPlainObject(value)) {
    return Object.keys(value).length === 0 ? [] : [value];
  }
  return value;
}

export const authorizeResponseSchema = z
  .object({
    token: z.string().min(1),
    role: z.string().min(1),
  })
  .passthrough();

export const sdmSummarySchema = z
  .object({
    id_sdm: z.string().min(1),
    nama_sdm: z.string().min(1),
    nidn: nullableText,
    nip: nullableText,
    nuptk: nullableText,
    nama_status_aktif: nullableText,
    nama_status_pegawai: nullableText,
    jenis_sdm: nullableText,
  })
  .passthrough();

export const sdmSummaryListSchema = z.array(sdmSummarySchema);

export const sdmProfileSchema = z
  .object({
    nama: z.string().min(1),
    jenis_kelamin: z.string().min(1),
    tempat_lahir: z.string().min(1),
    tanggal_lahir: z.string().min(1),
  })
  .passthrough();

export const sdmEmploymentSchema = z
  .object({
    nip: nullableText,
    sk_cpns: nullableText,
    tanggal_sk_cpns: nullableText,
    sk_tmmd: nullableText,
    tmmd: nullableText,
    id_sumber_gaji: z.number().int().nullable().optional().transform((value) => value ?? null),
    sumber_gaji: nullableText,
    nidn: nullableText,
    nuptk: nullableText,
  })
  .passthrough();

export const profilPtSchema = z
  .object({
    id: z.string().min(1),
    kode_perguruan_tinggi: text,
    nama_perguruan_tinggi: text,
    telepon: text,
    faximile: text,
    email: text,
    website: text,
    jalan: text,
    dusun: text,
    rt: nullableNumeric,
    rw: nullableNumeric,
    kelurahan: text,
    kode_pos: text,
    id_wilayah: text,
  })
  .passthrough();

// Live SISTER returns one object keyed by `id_perguruan_tinggi`; the PDF
// documents an array keyed by `id`. Accept both.
export const profilPtListSchema = z.preprocess(
  (value) => {
    const items = asArray(value);
    return Array.isArray(items)
      ? items.map((item) =>
          isPlainObject(item) && item.id === undefined
            ? { ...item, id: item.id_perguruan_tinggi }
            : item,
        )
      : items;
  },
  z.array(profilPtSchema),
);

export const semesterSchema = z
  .object({
    id: z.number().int(),
    nama: z.string(),
  })
  .passthrough();

export const semesterListSchema = z.array(semesterSchema);

export const perguruanTinggiSchema = z
  .object({
    id: z.string(),
    nama: z.string(),
  })
  .passthrough();

export const perguruanTinggiListSchema = z.preprocess(asArray, z.array(perguruanTinggiSchema));

export const unitKerjaSchema = z
  .object({
    id: z.string(),
    nama: z.string(),
    id_jenis_unit: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
      z.literal(8),
    ]),
  })
  .passthrough();

// Without a valid parent SISTER returns placeholder rows with null id/nama;
// those carry no selectable unit and are dropped.
export const unitKerjaListSchema = z.preprocess(
  (value) =>
    Array.isArray(value)
      ? value.filter((item) => isPlainObject(item) && typeof item.id === "string")
      : asArray(value),
  z.array(unitKerjaSchema),
);

export const wilayahSchema = z
  .object({
    id: z.string(),
    nama: z.string(),
    id_induk_wilayah: text,
  })
  .passthrough();

export const wilayahListSchema = z.array(wilayahSchema);

export const bkdLaporanAkhirSchema = z
  .object({
    id_reg_ptk: z.string().uuid(),
    id_smt: z.string(),
    sks_kinerja_ajar: numeric,
    sks_lebih_ajar: numeric,
    sks_kinerja_didik: numeric,
    sks_lebih_didik: numeric,
    sks_kinerja_lit: numeric,
    sks_lebih_lit: numeric,
    sks_kinerja_pengmas: numeric,
    sks_lebih_pengmas: numeric,
    sks_kinerja_penunjang: numeric,
    sks_lebih_tunjang: numeric,
    sks_kinerja: numeric,
    sks_lebih: numeric,
    stat_kewajiban: nullableNumeric,
    stat_tugas: text,
    stat_belajar: text,
    id_jabfung: nullableNumeric,
    simpulan_asesor: text,
  })
  .passthrough();

export const bkdLaporanAkhirListSchema = z.array(bkdLaporanAkhirSchema);

export const bkdActivitySchema = z
  .object({
    nm_sdm: text,
    nidn: text,
    id_smt: z.string(),
    unsur: text,
    judul_keg: text,
    id_katgiat: numeric,
    nm_kat: text,
    beban_sks: numeric,
    nilai: nullableNumeric,
  })
  .passthrough();

export const bkdActivityListSchema = z.array(bkdActivitySchema);

export const penugasanSummarySchema = z
  .object({
    id: z.string().min(1),
    status_kepegawaian: text,
    ikatan_kerja: text,
    unit_kerja: text,
    jenjang_pendidikan: text,
    perguruan_tinggi: text,
    tanggal_mulai: text,
    tanggal_keluar: text,
  })
  .passthrough();

export const penugasanSummaryListSchema = z.array(penugasanSummarySchema);

export const penugasanDetailSchema = penugasanSummarySchema
  .extend({
    id_sdm: z.string(),
    surat_tugas: text,
    tanggal_surat_tugas: text,
    jenis_keluar: text,
    id_jenis_keluar: text,
    id_status_kepegawaian: nullableNumeric,
    id_ikatan_kerja: text,
    id_perguruan_tinggi: text,
    id_unit_kerja: text,
  })
  .passthrough();

export const pendidikanFormalDocumentSchema = z
  .object({
    id: z.string().min(1),
    nama: text,
    jenis_dokumen: text,
    nama_file: text,
    jenis_file: text,
    tanggal_upload: text,
    tautan: nullableText,
    keterangan: nullableText,
  })
  .passthrough();

const pendidikanFormalBaseSchema = z.object({
  id: z.string().min(1),
  jenjang_pendidikan: text,
  gelar_akademik: text,
  bidang_studi: text,
  nama_perguruan_tinggi: text,
  tahun_lulus: nullableNumeric,
});

// `jenis_ajuan` is documented as an integer on the list and a string on the
// detail; live SISTER sends a string or null on both.
const jenisAjuan = z
  .union([z.string(), z.number()])
  .nullable()
  .optional()
  .transform((value) => (value === null || value === undefined ? "" : String(value)));

const documentList = <T extends z.ZodTypeAny>(schema: T) =>
  z.array(schema).nullable().optional().transform((value) => value ?? []);

export const pendidikanFormalSummarySchema = pendidikanFormalBaseSchema
  .extend({
    jenis_ajuan: jenisAjuan,
  })
  .passthrough();

export const pendidikanFormalSummaryListSchema = z.array(pendidikanFormalSummarySchema);

export const pendidikanFormalDetailSchema = pendidikanFormalBaseSchema
  .extend({
    jenis_ajuan: jenisAjuan,
    kategori_kegiatan: text,
    id_sdm: z.string(),
    id_program_studi: text,
    nama_program_studi: text,
    id_jenjang_pendidikan: nullableNumeric,
    id_gelar_akademik: nullableNumeric,
    id_bidang_studi: nullableNumeric,
    tahun_masuk: nullableNumeric,
    tanggal_lulus: text,
    nomor_induk: text,
    jumlah_semester: nullableNumeric,
    jumlah_sks: nullableNumeric,
    ipk: nullableNumeric,
    sk_penyetaraan: text,
    tanggal_sk_penyetaraan: text,
    nomor_ijazah: text,
    judul_tugas_akhir: text,
    dokumen: documentList(pendidikanFormalDocumentSchema),
  })
  .passthrough();

export const riwayatPekerjaanDocumentSchema = z
  .object({
    id: z.string().min(1),
    nama: text,
    jenis_dokumen: text,
    nama_file: text,
    jenis_file: text,
    tanggal_upload: text,
    tautan: nullableText,
    keterangan: nullableText,
  })
  .passthrough();

const riwayatPekerjaanBaseSchema = z.object({
  id: z.string().min(1),
  jenis_pekerjaan: text,
  nama_jabatan: text,
  instansi: text,
  divisi: text,
  mulai_bekerja: text,
  selesai_bekerja: text,
  luar_negeri: z.boolean().nullable().optional().transform((value) => value ?? false),
  bidang_usaha: text,
});

export const riwayatPekerjaanSummarySchema = riwayatPekerjaanBaseSchema.passthrough();

export const riwayatPekerjaanSummaryListSchema = z.array(riwayatPekerjaanSummarySchema);

export const riwayatPekerjaanDetailSchema = riwayatPekerjaanBaseSchema
  .extend({
    id_sdm: z.string(),
    id_bidang_usaha: nullableNumeric,
    id_jenis_pekerjaan: nullableNumeric,
    deskripsi_kerja: text,
    dokumen: documentList(riwayatPekerjaanDocumentSchema),
  })
  .passthrough();

export type SdmSummary = z.infer<typeof sdmSummarySchema>;
export type SdmProfile = z.infer<typeof sdmProfileSchema>;
export type SdmEmployment = z.infer<typeof sdmEmploymentSchema>;
export type ProfilPt = z.infer<typeof profilPtSchema>;
export type Semester = z.infer<typeof semesterSchema>;
export type PerguruanTinggi = z.infer<typeof perguruanTinggiSchema>;
export type UnitKerja = z.infer<typeof unitKerjaSchema>;
export type Wilayah = z.infer<typeof wilayahSchema>;
export type BkdLaporanAkhir = z.infer<typeof bkdLaporanAkhirSchema>;
export type BkdActivity = z.infer<typeof bkdActivitySchema>;
export type PenugasanSummary = z.infer<typeof penugasanSummarySchema>;
export type PenugasanDetail = z.infer<typeof penugasanDetailSchema>;
export type PendidikanFormalDocument = z.infer<typeof pendidikanFormalDocumentSchema>;
export type PendidikanFormalSummary = z.infer<typeof pendidikanFormalSummarySchema>;
export type PendidikanFormalDetail = z.infer<typeof pendidikanFormalDetailSchema>;
export type RiwayatPekerjaanDocument = z.infer<typeof riwayatPekerjaanDocumentSchema>;
export type RiwayatPekerjaanSummary = z.infer<typeof riwayatPekerjaanSummarySchema>;
export type RiwayatPekerjaanDetail = z.infer<typeof riwayatPekerjaanDetailSchema>;
