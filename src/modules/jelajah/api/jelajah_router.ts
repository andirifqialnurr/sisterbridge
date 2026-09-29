import { TRPCError } from "@trpc/server";

import { SisterApiError, SisterContractError, SisterNotFoundError } from "@/server/sister/errors";
import { createTRPCRouter, operatorProcedure } from "@/server/trpc/init";

import {
  jelajahChildInputSchema,
  jelajahDetailInputSchema,
  jelajahListInputSchema,
} from "./jelajah_schemas";
import {
  getJelajahChild,
  getJelajahDetail,
  getJelajahList,
  JelajahUnavailableError,
  listJelajahModules,
} from "./jelajah_service";

// The explorer is for studying SISTER, so the HTTP status SISTER answered is
// part of the message; SISTER's own error text is not passed through.
function toSafeTrpcError(error: unknown): never {
  if (error instanceof JelajahUnavailableError) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: error.message });
  }

  if (error instanceof SisterNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Data tidak ditemukan di SISTER" });
  }

  if (error instanceof SisterApiError) {
    const code =
      error.status === 401
        ? "UNAUTHORIZED"
        : error.status === 403
          ? "FORBIDDEN"
          : error.status === 429
            ? "TOO_MANY_REQUESTS"
            : "BAD_GATEWAY";

    throw new TRPCError({
      code,
      message:
        error.status === 429
          ? "SISTER membatasi request (429). Tunggu beberapa menit lalu coba lagi."
          : `SISTER menjawab HTTP ${error.status}`,
    });
  }

  if (error instanceof SisterContractError) {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Response SISTER bukan JSON yang valid" });
  }

  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Permintaan jelajah data gagal" });
}

async function run<T>(query: () => Promise<T>) {
  try {
    return await query();
  } catch (error) {
    return toSafeTrpcError(error);
  }
}

export const jelajahRouter = createTRPCRouter({
  modules: operatorProcedure.query(() => listJelajahModules()),
  list: operatorProcedure
    .input(jelajahListInputSchema)
    .query(({ input }) => run(() => getJelajahList(input))),
  detail: operatorProcedure
    .input(jelajahDetailInputSchema)
    .query(({ input }) => run(() => getJelajahDetail(input))),
  child: operatorProcedure
    .input(jelajahChildInputSchema)
    .query(({ input }) => run(() => getJelajahChild(input))),
});
