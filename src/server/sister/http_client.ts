import { z, type ZodType } from "zod";

import { getSisterConfig } from "./config";
import { SisterApiError, SisterContractError } from "./errors";
import { getSisterToken } from "./token_provider";
import { buildSisterUrl } from "./url";

type RequestOptions<T> = {
  path: string;
  query?: Record<string, string | number | undefined>;
  schema: ZodType<T>;
  // Defaults to 15s. Large reference lists (e.g. `/referensi/dudi`, ~3.5 MB)
  // need longer when fetched in bulk by the replica sync.
  timeoutMs?: number;
};

const maxFetchAttempts = 3;
const retryDelayMs = 200;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// GET is safe to retry; this only retries when fetch itself throws (network
// failure, DNS error, timeout abort), never after a response is received —
// an HTTP error status is a completed, non-retriable answer from SISTER.
async function fetchWithBoundedRetry(url: URL, init: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxFetchAttempts; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      if (attempt < maxFetchAttempts) {
        await wait(retryDelayMs * attempt);
      }
    }
  }

  throw lastError;
}

export async function sisterGet<T>({
  path,
  query,
  schema,
  timeoutMs = 15_000,
}: RequestOptions<T>): Promise<T> {
  const config = getSisterConfig();
  if (config.fixture_mode || !config.base_url) {
    throw new Error("SISTER live HTTP is not enabled");
  }

  const token = await getSisterToken();
  const response = await fetchWithBoundedRetry(buildSisterUrl(config.base_url, path, query), {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token.token}`,
    },
    redirect: "error",
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });

  if (response.status === 204) {
    throw new SisterContractError("SISTER returned 204 for a JSON read operation");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    // SISTER's gateway reports 502/503/504 as text/plain; keep the HTTP status
    // so callers can tell an outage from a contract break.
    if (!response.ok) {
      throw new SisterApiError(response.status, `SISTER_HTTP_${response.status}`);
    }
    throw new SisterContractError("SISTER read response is not JSON");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new SisterContractError("SISTER read response could not be parsed");
  }

  if (!response.ok) {
    const errorPayload = z
      .object({ message: z.string().optional(), detail: z.string().optional() })
      .safeParse(payload);
    throw new SisterApiError(
      response.status,
      `SISTER_HTTP_${response.status}`,
      errorPayload.success && errorPayload.data.message
        ? errorPayload.data.message
        : "SISTER request failed",
    );
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new SisterContractError("SISTER read response does not match the documented schema");
  }

  return parsed.data;
}

export type SisterFile = {
  contentType: string;
  fileName: string | null;
  body: ArrayBuffer;
};

// Binary GET endpoints (`/data_pribadi/foto/{id_sdm}`,
// `/dokumen/{id}/download`). Only allowlisted content types are passed on and
// the body is capped, so SISTER cannot make the app serve arbitrary content.
export const sisterFileContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export const sisterFileMaxBytes = 25 * 1024 * 1024;

function fileNameFrom(disposition: string | null) {
  // filename="quoted \"string\"" | filename=token | filename*=UTF-8''pct
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?(?:"((?:[^"\\]|\\.)*)"|([^;]+))/i);
  if (!match) {
    return null;
  }
  let name = (match[1] ?? match[2]).replace(/\\(.)/g, "$1");
  try {
    name = decodeURIComponent(name);
  } catch {
    // keep the raw value
  }
  // Strip path parts and characters that are unsafe in a header value.
  const safe = name.split(/[\/]/).pop()!.replace(/[^\w.\- ()]/g, "_").slice(0, 150).trim();
  return safe || null;
}

export async function sisterGetFile(path: string, timeoutMs = 60_000): Promise<SisterFile> {
  const config = getSisterConfig();
  if (config.fixture_mode || !config.base_url) {
    throw new Error("SISTER live HTTP is not enabled");
  }

  const token = await getSisterToken();
  const response = await fetchWithBoundedRetry(buildSisterUrl(config.base_url, path), {
    method: "GET",
    headers: { Authorization: `Bearer ${token.token}` },
    redirect: "error",
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });

  const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!response.ok) {
    throw new SisterApiError(response.status, `SISTER_HTTP_${response.status}`);
  }
  if (!(sisterFileContentTypes as readonly string[]).includes(contentType)) {
    throw new SisterContractError("SISTER file response has a content type that is not allowed");
  }
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > sisterFileMaxBytes) {
    throw new SisterContractError("SISTER file is larger than the allowed size");
  }

  const body = await response.arrayBuffer();
  if (body.byteLength > sisterFileMaxBytes) {
    throw new SisterContractError("SISTER file is larger than the allowed size");
  }

  return { contentType, fileName: fileNameFrom(response.headers.get("content-disposition")), body };
}
