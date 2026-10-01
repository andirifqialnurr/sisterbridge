import { TRPCError } from "@trpc/server";

import { SisterApiError, SisterContractError, SisterNotFoundError } from "@/server/sister/errors";
import { adminProcedure, createTRPCRouter } from "@/server/trpc/init";
import { getJelajahDetail, getJelajahList } from "@/modules/jelajah/api/jelajah_service";
import { getJelajahModule } from "@/modules/jelajah/api/jelajah_catalog";

import {
  businessDetailInputSchema,
  businessLiveDetailInputSchema,
  businessLiveSearchInputSchema,
  businessReportInputSchema,
  businessRowsInputSchema,
  businessSdmInputSchema,
} from "./business_schemas";
import {
  businessModules,
  BusinessDataUnavailableError,
  getBusinessDetail,
  getBusinessRows,
  searchBusinessSdm,
} from "./business_service";
import {
  BusinessReportUnavailableError,
  getBusinessReport,
  getBusinessWarnings,
} from "./business_reporting_service";

function safeError(error: unknown): never {
  if (error instanceof BusinessDataUnavailableError || error instanceof BusinessReportUnavailableError) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: error.message });
  }
  if (error instanceof SisterNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: error.message });
  }
  if (error instanceof SisterApiError) {
    const code = error.status === 403 ? "FORBIDDEN" : error.status === 404 ? "NOT_FOUND" : "BAD_GATEWAY";
    throw new TRPCError({ code, message: "SISTER menjawab HTTP " + error.status });
  }
  if (error instanceof SisterContractError) {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Response SISTER belum sesuai kontrak." });
  }
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Data modul gagal dibaca." });
}

async function run<T>(query: () => Promise<T>) {
  try {
    return await query();
  } catch (error) {
    return safeError(error);
  }
}

export const businessRouter = createTRPCRouter({
  modules: adminProcedure.query(() => businessModules()),
  sdm: adminProcedure.input(businessSdmInputSchema).query(({ input }) => run(() => searchBusinessSdm(input))),
  rows: adminProcedure.input(businessRowsInputSchema).query(({ input }) => run(() => getBusinessRows(input))),
  detail: adminProcedure.input(businessDetailInputSchema).query(({ input }) => run(() => getBusinessDetail(input))),
  report: adminProcedure.input(businessReportInputSchema).query(({ input }) => run(() => getBusinessReport(input))),
  warnings: adminProcedure.query(() => run(() => getBusinessWarnings())),
  live_search: adminProcedure.input(businessLiveSearchInputSchema).query(({ input }) => run(() => {
    if (getJelajahModule(input.module)?.kind !== "search") throw new BusinessDataUnavailableError("Hanya modul pencarian yang membaca SISTER langsung.");
    return getJelajahList(input);
  })),
  live_detail: adminProcedure.input(businessLiveDetailInputSchema).query(({ input }) => run(() => {
    const catalogEntry = getJelajahModule(input.module);
    if (catalogEntry?.kind !== "search" || !catalogEntry.detailPath) throw new BusinessDataUnavailableError("Detail langsung hanya tersedia untuk hasil pencarian yang diizinkan.");
    return getJelajahDetail(input);
  })),
});
