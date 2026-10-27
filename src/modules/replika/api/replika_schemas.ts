import { z } from "zod";

import { jelajahModuleKeySchema } from "@/modules/jelajah/api/jelajah_schemas";

const replicaIdSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{1,64}$/);
const pagination = {
  page: z.number().int().min(1).max(1_000_000).optional(),
  per_page: z.number().int().min(1).max(100).optional(),
};

export const replikaModulesInputSchema = z.object({
  id_sdm: z.string().uuid().optional(),
});

export const replikaModuleInputSchema = z.object({
  ...pagination,
  search: z.string().trim().max(120).optional(),
  module: jelajahModuleKeySchema,
  id_sdm: z.string().uuid().optional(),
});

export const replikaItemInputSchema = z.object({
  ...pagination,
  section_pages: z.record(z.string().max(128), z.number().int().min(1).max(1_000_000))
    .refine((pages) => Object.keys(pages).length <= 100).optional(),
  module: jelajahModuleKeySchema,
  id: replicaIdSchema,
  id_sdm: z.string().uuid().optional(),
});

export const replikaSyncStatusInputSchema = z.object({
  run_page: z.number().int().min(1).max(1_000_000).default(1),
  scope_page: z.number().int().min(1).max(1_000_000).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
}).prefault({});

export type ReplikaSyncStatusInput = z.infer<typeof replikaSyncStatusInputSchema>;
export type ReplikaModulesInput = z.infer<typeof replikaModulesInputSchema>;
export type ReplikaModuleInput = z.infer<typeof replikaModuleInputSchema>;
export type ReplikaItemInput = z.infer<typeof replikaItemInputSchema>;

export type ReplikaRowsResult = {
  endpoint: string;
  query: Record<string, string>;
  shape: "array" | "empty";
  item_count: number;
  total: number;
  page: number;
  per_page: number;
  truncated: boolean;
  data: Record<string, unknown>[];
  fetched_at: string;
  columns: { name: string; type: string }[];
};
