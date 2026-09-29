import { z } from "zod";

import { jelajahModuleKeySchema } from "@/modules/jelajah/api/jelajah_schemas";

const replicaIdSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{1,64}$/);

export const replikaModulesInputSchema = z.object({
  id_sdm: z.string().uuid().optional(),
});

export const replikaModuleInputSchema = z.object({
  module: jelajahModuleKeySchema,
  id_sdm: z.string().uuid().optional(),
});

export const replikaItemInputSchema = z.object({
  module: jelajahModuleKeySchema,
  id: replicaIdSchema,
  // Value of a child's source field taken from the list row (e.g. id_kelas)
  // when the item has no detail row in the replica.
  source_value: replicaIdSchema.optional(),
});

export type ReplikaModulesInput = z.infer<typeof replikaModulesInputSchema>;
export type ReplikaModuleInput = z.infer<typeof replikaModuleInputSchema>;
export type ReplikaItemInput = z.infer<typeof replikaItemInputSchema>;

export type ReplikaRowsResult = {
  endpoint: string;
  query: Record<string, string>;
  shape: "array" | "empty";
  item_count: number;
  truncated: boolean;
  data: Record<string, unknown>[];
  fetched_at: string;
  columns: { name: string; type: string }[];
};
