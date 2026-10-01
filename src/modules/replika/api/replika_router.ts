import { TRPCError } from "@trpc/server";

import { SisterNotFoundError } from "@/server/sister/errors";
import { adminProcedure, createTRPCRouter, operatorProcedure } from "@/server/trpc/init";

import { getReplikaDashboard } from "./replika_dashboard_service";
import {
  replikaItemInputSchema,
  replikaModuleInputSchema,
  replikaModulesInputSchema,
} from "./replika_schemas";
import {
  getReplikaItem,
  getReplikaRows,
  getReplikaSyncStatus,
  listReplikaModules,
  ReplikaUnavailableError,
} from "./replika_service";

function toSafeTrpcError(error: unknown): never {
  if (error instanceof ReplikaUnavailableError) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: error.message });
  }
  if (error instanceof SisterNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: error.message });
  }
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Data replika gagal dibaca" });
}

async function run<T>(query: () => Promise<T>) {
  try {
    return await query();
  } catch (error) {
    return toSafeTrpcError(error);
  }
}

// Replica rows carry the same data the live pages show, so they follow the
// same protected boundary; sync diagnostics are for operators.
export const replikaRouter = createTRPCRouter({
  modules: operatorProcedure
    .input(replikaModulesInputSchema)
    .query(({ input }) => run(() => listReplikaModules(input))),
  rows: operatorProcedure
    .input(replikaModuleInputSchema)
    .query(({ input }) => run(() => getReplikaRows(input))),
  item: operatorProcedure
    .input(replikaItemInputSchema)
    .query(({ input }) => run(() => getReplikaItem(input))),
  sync_status: operatorProcedure.query(() => run(() => getReplikaSyncStatus())),
  dashboard: adminProcedure.query(() => run(() => getReplikaDashboard())),
});
