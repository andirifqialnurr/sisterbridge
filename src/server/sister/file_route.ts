import { z } from "zod";

import { getCurrentUser, type AppRole, type AppSessionUser } from "@/server/auth/session";
import { checkRateLimit } from "@/server/security/rate_limiter";
import { recordSecurityAuditEvent } from "@/server/security/audit";
import { getSafeRequestId } from "@/server/security/request_policy";

import { SisterApiError, SisterContractError } from "./errors";
import { sisterGetFile, type SisterFile } from "./http_client";

export type SisterFileKind = "foto" | "dokumen";

type FileRouteOptions = {
  kind: SisterFileKind;
  id: string;
  request: Request;
  // Injectable for tests.
  loadUser?: (headers: Headers) => Promise<AppSessionUser | null>;
  loadFile?: (path: string) => Promise<SisterFile>;
};

const allowedRoles: Record<SisterFileKind, readonly AppRole[]> = {
  foto: ["ADMIN", "OPERATOR", "REVIEWER", "VIEWER"],
  // Supporting documents can be ID scans or SK letters: operators only.
  dokumen: ["ADMIN", "OPERATOR"],
};

const pathFor: Record<SisterFileKind, (id: string) => string> = {
  foto: (id) => `/data_pribadi/foto/${encodeURIComponent(id)}`,
  dokumen: (id) => `/dokumen/${encodeURIComponent(id)}/download`,
};

// Every file is a live SISTER request, so each user gets a small budget.
const rateLimit = { limit: 60, window_ms: 60_000 };

function json(status: number, message: string, requestId: string) {
  return Response.json(
    { message },
    { status, headers: { "cache-control": "no-store", "x-request-id": requestId } },
  );
}

// Streams one SISTER file to the browser. The browser never sees the SISTER
// token or URL; IDs are validated, content types are allowlisted in
// sisterGetFile, and responses are private, non-cacheable, and sandboxed.
export async function handleSisterFileRequest({
  id,
  kind,
  loadFile = sisterGetFile,
  loadUser = getCurrentUser,
  request,
}: FileRouteOptions): Promise<Response> {
  const requestId = getSafeRequestId(request);
  const user = await loadUser(request.headers);
  if (!user) {
    return json(401, "Authentication is required", requestId);
  }
  if (!allowedRoles[kind].includes(user.role)) {
    void recordSecurityAuditEvent({
      event_type: "authorization_denied",
      severity: "MEDIUM",
      outcome: "DENIED",
      actor_user_id: user.id,
      request_id: requestId,
      route_or_procedure: `api.sister.file.${kind}`,
      metadata: { reason: "role_not_allowed", actual_role: user.role },
    });
    return json(403, "Role ini tidak dapat membuka file SISTER", requestId);
  }
  if (!z.string().uuid().safeParse(id).success) {
    return json(400, "ID tidak valid", requestId);
  }
  if (!checkRateLimit(`sister-file:${user.id}`, rateLimit).allowed) {
    return json(429, "Terlalu banyak permintaan file; coba lagi sebentar", requestId);
  }

  let file: SisterFile;
  try {
    file = await loadFile(pathFor[kind](id));
  } catch (error) {
    if (error instanceof SisterApiError) {
      const status = error.status === 404 ? 404 : error.status === 429 ? 429 : 502;
      return json(status, status === 404 ? "File tidak ditemukan di SISTER" : `SISTER menjawab HTTP ${error.status}`, requestId);
    }
    if (error instanceof SisterContractError) {
      return json(502, "File dari SISTER ditolak (tipe atau ukuran tidak diizinkan)", requestId);
    }
    return json(502, "File SISTER tidak dapat diambil", requestId);
  }

  if (kind === "dokumen") {
    void recordSecurityAuditEvent({
      event_type: "sister_document_download",
      severity: "INFO",
      outcome: "SUCCESS",
      actor_user_id: user.id,
      request_id: requestId,
      route_or_procedure: "api.sister.file.dokumen",
      target_type: "sister_dokumen",
      target_id: id,
      metadata: { content_type: file.contentType, bytes: file.body.byteLength },
    });
  }

  const inline = kind === "foto";
  const fileName = file.fileName ?? `${kind}-${id}`;
  return new Response(file.body, {
    status: 200,
    headers: {
      "content-type": file.contentType,
      "content-length": String(file.body.byteLength),
      "content-disposition": `${inline ? "inline" : "attachment"}; filename="${fileName.replaceAll('"', "")}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": "sandbox; default-src 'none'",
      "x-request-id": requestId,
    },
  });
}
