import { z } from "zod";

import { SisterApiError, SisterContractError } from "../errors";
import { sisterGet } from "../http_client";
import { clearSisterTokenCache } from "../token_provider";

export type ReplicaFetchResult =
  | { ok: true; payload: unknown }
  | { ok: false; status: number; code: string; message: string };

export type ReplicaFetcher = (
  path: string,
  query?: Record<string, string>,
) => Promise<ReplicaFetchResult>;

const maxMessageLength = 200;
const requestTimeoutMs = 90_000;
const maxAttempts = 3;
const retryDelayMs = 1_500;
// SISTER's gateway answers 502/503/504 ("upstream connect error") under load
// and some endpoints answer 500 intermittently. GET is safe to repeat.
const retriableStatuses = new Set([500, 502, 503, 504]);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function failure(error: unknown): Extract<ReplicaFetchResult, { ok: false }> {
  if (error instanceof SisterApiError) {
    return {
      ok: false,
      status: error.status,
      code: error.safeCode,
      message: error.message.slice(0, maxMessageLength),
    };
  }

  if (error instanceof SisterContractError) {
    return { ok: false, status: 0, code: "CONTRACT", message: error.message };
  }

  const name = error instanceof Error ? error.name : "Error";
  return { ok: false, status: 0, code: "NETWORK", message: name };
}

// GET only. A 401 means the cached token expired early (SISTER tokens live
// 60 minutes and a full sync outlasts one), so the token is dropped and the
// request repeated; transient 5xx answers are retried with backoff.
export const fetchSisterJson: ReplicaFetcher = async (path, query) => {
  let last: Extract<ReplicaFetchResult, { ok: false }> | null = null;
  let reauthorized = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const payload = await sisterGet({
        path,
        query,
        schema: z.unknown(),
        timeoutMs: requestTimeoutMs,
      });
      return { ok: true, payload };
    } catch (error) {
      last = failure(error);
      if (last.status === 401 && !reauthorized) {
        reauthorized = true;
        clearSisterTokenCache();
        continue;
      }
      // A non-JSON body is how the gateway reports 502/503 (text/plain), so
      // contract failures are retried as well.
      if (!retriableStatuses.has(last.status) && last.code !== "CONTRACT" && last.code !== "NETWORK") {
        return last;
      }
      if (attempt < maxAttempts) {
        await wait(retryDelayMs * attempt);
      }
    }
  }

  return last!;
};
