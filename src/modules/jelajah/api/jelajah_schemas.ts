import { z } from "zod";

import { jelajahModuleKeys } from "./jelajah_catalog";

// SISTER IDs seen so far are UUIDs or short numeric/alphanumeric codes.
const sisterIdSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{1,64}$/);

export const jelajahModuleKeySchema = z.enum(jelajahModuleKeys);

export const jelajahListInputSchema = z.object({
  module: jelajahModuleKeySchema,
  id_sdm: z.string().uuid().optional(),
});

export const jelajahDetailInputSchema = z.object({
  module: jelajahModuleKeySchema,
  id: sisterIdSchema,
});

export const jelajahChildInputSchema = z.object({
  module: jelajahModuleKeySchema,
  child: z.enum(["bidang_ilmu", "kelas_dokumen", "detail_unit_kerja"]),
  id: sisterIdSchema,
});

// Raw SISTER JSON is returned on purpose: this explorer exists to study the
// live structure before typed replica tables are designed.
export const jelajahResultSchema = z.object({
  module: z.string(),
  endpoint: z.string(),
  query: z.record(z.string(), z.string()),
  shape: z.enum(["array", "object", "empty"]),
  item_count: z.number().int().min(0),
  data: z.unknown(),
  fetched_at: z.string().datetime(),
  source: z.literal("sister"),
});

export type JelajahListInput = z.infer<typeof jelajahListInputSchema>;
export type JelajahDetailInput = z.infer<typeof jelajahDetailInputSchema>;
export type JelajahChildInput = z.infer<typeof jelajahChildInputSchema>;
export type JelajahResult = z.infer<typeof jelajahResultSchema>;
