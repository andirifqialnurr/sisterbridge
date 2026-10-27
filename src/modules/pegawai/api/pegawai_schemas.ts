import { z } from "zod";

export const pegawaiSearchInputSchema = z
  .object({
    search_by: z.enum(["nama", "nidn", "nip", "nuptk"]).default("nama"),
    search: z.string().trim().max(120).default(""),
    id_sp: z.string().trim().min(1).max(128).optional(),
    page: z.number().int().min(1).max(1_000_000).default(1),
    per_page: z.number().int().min(1).max(50).default(20),
  })
  .superRefine((input, context) => {
    if (input.id_sp && input.search_by === "nama" && input.search.length < 3) {
      context.addIssue({
        code: "custom",
        path: ["search"],
        message: "Pencarian nama dengan id_sp membutuhkan minimal 3 karakter",
      });
    }
  });

export const pegawaiIdInputSchema = z.object({
  id_sdm: z.string().uuid(),
});

export type PegawaiSearchInput = z.infer<typeof pegawaiSearchInputSchema>;

export const pegawaiSearchResultSchema = z.object({
  id_sdm: z.string().min(1),
  nama_sdm: z.string().min(1),
  nidn: z.string().nullable(),
  nip: z.string().nullable(),
  nuptk: z.string().nullable(),
  nama_status_aktif: z.string().nullable(),
  nama_status_pegawai: z.string().nullable(),
  jenis_sdm: z.string().nullable(),
});

export const pegawaiSearchResponseSchema = z.object({
  items: z.array(pegawaiSearchResultSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  source: z.enum(["fixture", "sister"]),
  fetched_at: z.string().datetime(),
});

export const pegawaiDetailResponseSchema = z.object({
  summary: pegawaiSearchResultSchema,
  profile: z.object({
    nama: z.string(),
    jenis_kelamin: z.string(),
    tempat_lahir: z.string(),
    tanggal_lahir: z.string(),
  }),
  employment: z.object({
    nip: z.string().nullable(),
    sk_cpns: z.string().nullable(),
    tanggal_sk_cpns: z.string().nullable(),
    sk_tmmd: z.string().nullable(),
    tmmd: z.string().nullable(),
    id_sumber_gaji: z.number().int().nullable(),
    sumber_gaji: z.string().nullable(),
    nidn: z.string().nullable(),
    nuptk: z.string().nullable(),
  }),
  source: z.enum(["fixture", "sister"]),
  fetched_at: z.string().datetime(),
});

export type PegawaiSearchResult = z.infer<typeof pegawaiSearchResultSchema>;
export type PegawaiSearchResponse = z.infer<typeof pegawaiSearchResponseSchema>;
export type PegawaiDetailResponse = z.infer<typeof pegawaiDetailResponseSchema>;
