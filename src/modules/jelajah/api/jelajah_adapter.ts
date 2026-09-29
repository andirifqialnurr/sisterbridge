import { z } from "zod";

import { SisterApiError } from "@/server/sister/errors";
import { sisterGet } from "@/server/sister/http_client";

// Returns the parsed JSON, or null when SISTER answers 404 ("no data").
export type JelajahFetcher = (path: string, query?: Record<string, string>) => Promise<unknown>;

const retryStatuses = new Set([502, 503, 504]);
const retryDelayMs = 1_500;

// SISTER's gateway intermittently answers 502/503/504 ("upstream connect
// error"), especially on search endpoints; one delayed retry covers it.
export const fetchSisterRaw: JelajahFetcher = async (path, query) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await sisterGet({ path, query, schema: z.unknown(), timeoutMs: 60_000 });
    } catch (error) {
      if (error instanceof SisterApiError && error.status === 404) {
        return null;
      }
      if (attempt < 2 && error instanceof SisterApiError && retryStatuses.has(error.status)) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }
      throw error;
    }
  }
};
