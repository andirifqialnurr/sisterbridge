import { describe, expect, it, vi } from "vitest";

const auditMock = vi.hoisted(() => vi.fn().mockResolvedValue({ persisted: true }));
vi.mock("@/server/security/audit", () => ({ recordSecurityAuditEvent: auditMock }));

import { SisterApiError, SisterContractError } from "./errors";
import { handleSisterFileRequest } from "./file_route";

const id = "8fe6735c-6e28-43e7-9eb3-3ae092bbcd62";
const request = () => new Request(`https://app.test/api/sister/file/x/${id}`);
const user = (role: "ADMIN" | "OPERATOR" | "VIEWER") => async () => ({
  id: `00000000-0000-4000-8000-00000000000${role.length}`,
  email: "u@example.test",
  name: "U",
  role,
});
const pdf = async () => ({
  contentType: "application/pdf",
  fileName: "SK Mengajar.pdf",
  body: new TextEncoder().encode("%PDF-1.7").buffer as ArrayBuffer,
});

describe("handleSisterFileRequest", () => {
  it("requires a session", async () => {
    const response = await handleSisterFileRequest({
      kind: "foto",
      id,
      request: request(),
      loadUser: async () => null,
      loadFile: pdf,
    });
    expect(response.status).toBe(401);
  });

  it("limits documents to operators but lets any user see a photo", async () => {
    const loadFile = vi.fn(pdf);
    const denied = await handleSisterFileRequest({ kind: "dokumen", id, request: request(), loadUser: user("VIEWER"), loadFile });
    expect(denied.status).toBe(403);
    expect(loadFile).not.toHaveBeenCalled();

    const photo = await handleSisterFileRequest({
      kind: "foto",
      id,
      request: request(),
      loadUser: user("VIEWER"),
      loadFile: async () => ({ contentType: "image/jpeg", fileName: null, body: new ArrayBuffer(4) }),
    });
    expect(photo.status).toBe(200);
    expect(photo.headers.get("content-disposition")).toBe(`inline; filename="foto-${id}"`);
  });

  it("rejects non-UUID ids before calling SISTER", async () => {
    const loadFile = vi.fn(pdf);
    const response = await handleSisterFileRequest({
      kind: "dokumen",
      id: "../../authorize",
      request: request(),
      loadUser: user("ADMIN"),
      loadFile,
    });
    expect(response.status).toBe(400);
    expect(loadFile).not.toHaveBeenCalled();
  });

  it("serves documents as private sandboxed attachments and audits the download", async () => {
    const loadFile = vi.fn(pdf);
    const response = await handleSisterFileRequest({ kind: "dokumen", id, request: request(), loadUser: user("OPERATOR"), loadFile });

    expect(loadFile).toHaveBeenCalledWith(`/dokumen/${id}/download`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="SK Mengajar.pdf"');
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-security-policy")).toContain("sandbox");
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: "sister_document_download", target_id: id }),
    );
  });

  it("maps SISTER failures without leaking details", async () => {
    const notFound = await handleSisterFileRequest({
      kind: "foto",
      id,
      request: request(),
      loadUser: user("ADMIN"),
      loadFile: async () => {
        throw new SisterApiError(404, "SISTER_HTTP_404");
      },
    });
    expect(notFound.status).toBe(404);

    const blockedType = await handleSisterFileRequest({
      kind: "dokumen",
      id,
      request: request(),
      loadUser: user("ADMIN"),
      loadFile: async () => {
        throw new SisterContractError("type");
      },
    });
    expect(blockedType.status).toBe(502);
    expect(await blockedType.json()).toEqual({ message: expect.stringContaining("tidak diizinkan") });
  });
});
