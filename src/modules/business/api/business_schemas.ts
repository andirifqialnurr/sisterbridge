import { z } from "zod";

import { jelajahListInputSchema, jelajahModuleKeySchema } from "@/modules/jelajah/api/jelajah_schemas";

export const businessSdmInputSchema = z.object({
  search: z.string().trim().max(120).default(""),
  page: z.number().int().min(1).max(1000).default(1),
  per_page: z.number().int().min(1).max(100).default(25),
});

export const businessRowsInputSchema = z.object({
  module: jelajahModuleKeySchema,
  id_sdm: z.string().uuid().optional(),
  id_smt: z.string().trim().min(1).max(32).optional(),
  search: z.string().trim().max(120).default(""),
  page: z.number().int().min(1).max(1000).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
});

export const businessDetailInputSchema = z.object({
  module: jelajahModuleKeySchema,
  id: z.string().trim().regex(/^[A-Za-z0-9_-]{1,128}$/),
  id_sdm: z.string().uuid().optional(),
  page: z.number().int().min(1).max(1000).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
});

export const businessReportInputSchema = z.object({
  kind: z.enum(["sdm", "luaran", "bkd"]),
  jenis_sdm: z.string().trim().max(100).optional(),
  status_aktif: z.string().trim().max(100).optional(),
  module: z.enum(["publikasi", "penelitian", "pengabdian"]).optional(),
  tahun: z.number().int().min(1900).max(2200).optional(),
  id_smt: z.string().trim().min(1).max(32).optional(),
  simpulan: z.string().trim().max(100).optional(),
  page: z.number().int().min(1).max(1000).default(1),
  per_page: z.number().int().min(1).max(100).default(50),
});

export const businessLiveSearchInputSchema = jelajahListInputSchema;
export const businessLiveDetailInputSchema = z.object({
  module: jelajahModuleKeySchema,
  id: z.string().trim().regex(/^[A-Za-z0-9_-]{1,64}$/),
});

export type BusinessSdmInput = z.infer<typeof businessSdmInputSchema>;
export type BusinessRowsInput = z.infer<typeof businessRowsInputSchema>;
export type BusinessReportInput = z.infer<typeof businessReportInputSchema>;
export type BusinessDetailInput = z.infer<typeof businessDetailInputSchema>;
