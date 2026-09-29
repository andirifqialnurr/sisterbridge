import { z } from "zod";

import { SisterApiError } from "@/server/sister/errors";
import { sisterGet } from "@/server/sister/http_client";

// Returns the parsed JSON, or null when SISTER answers 404 ("no data").
export type JelajahFetcher = (path: string, query?: Record<string, string>) => Promise<unknown>;

export const fetchSisterRaw: JelajahFetcher = async (path, query) => {
  try {
    return await sisterGet({ path, query, schema: z.unknown(), timeoutMs: 60_000 });
  } catch (error) {
    if (error instanceof SisterApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
};
