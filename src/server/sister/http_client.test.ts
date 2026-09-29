import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const getSisterConfigMock = vi.hoisted(() => vi.fn());
const getSisterTokenMock = vi.hoisted(() => vi.fn());

vi.mock("./config", () => ({
  getSisterConfig: getSisterConfigMock,
}));

vi.mock("./token_provider", () => ({
  getSisterToken: getSisterTokenMock,
}));

import { sisterGet, sisterFileMaxBytes, sisterGetFile } from "./http_client";
import { SisterApiError, SisterContractError } from "./errors";

const liveConfig = {
  fixture_mode: false,
  base_url: "https://sister.example.test/ws-sandbox.php/1.0",
  id_pengguna: "user-1",
  integration_id: null,
  username: "user",
  password: "pass",
  credential_ref: null,
  sdm_cache_ttl_ms: 300_000,
};

const itemSchema = z.array(z.object({ id: z.string() }));

function jsonResponse(status: number, body: unknown, contentType = "application/json") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": contentType },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  getSisterConfigMock.mockReset();
  getSisterTokenMock.mockReset();
});

describe("sisterGet", () => {
  it("refuses to run when fixture mode is enabled or base_url is missing", async () => {
    getSisterConfigMock.mockReturnValue({ ...liveConfig, fixture_mode: true });
    await expect(sisterGet({ path: "/referensi/semester", schema: itemSchema })).rejects.toThrow(
      "SISTER live HTTP is not enabled",
    );

    getSisterConfigMock.mockReturnValue({ ...liveConfig, base_url: null });
    await expect(sisterGet({ path: "/referensi/semester", schema: itemSchema })).rejects.toThrow(
      "SISTER live HTTP is not enabled",
    );
  });

  it("rejects a protocol-relative path that would escape the configured base origin", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "tok", role: "WS-BASIC", expires_at: 0 });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    // "//host/path" starts with "/" (passes the absolute-path check) but
    // resolves against `base` as a protocol-relative URL pointing at a
    // different host entirely — this is the case the origin check exists for.
    await expect(
      sisterGet({ path: "//evil.test/steal", schema: itemSchema }),
    ).rejects.toThrow("SISTER adapter rejected an unsafe URL");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an absolute-URL path outright, before any origin check", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "tok", role: "WS-BASIC", expires_at: 0 });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sisterGet({ path: "https://evil.test/steal", schema: itemSchema }),
    ).rejects.toThrow("SISTER adapter paths must be absolute API paths");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a relative path that is not an absolute API path", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "tok", role: "WS-BASIC", expires_at: 0 });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sisterGet({ path: "referensi/semester", schema: itemSchema }),
    ).rejects.toThrow("SISTER adapter paths must be absolute API paths");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a Bearer token, blocks redirects, and only forwards defined query values", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "secret-token", role: "WS-BASIC", expires_at: 0 });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, [{ id: "1" }]));
    vi.stubGlobal("fetch", fetchMock);

    await sisterGet({
      path: "/referensi/wilayah",
      query: { id_level_wilayah: 0, unused: undefined, empty: "" },
      schema: itemSchema,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(requestUrl.toString()).toBe(
      "https://sister.example.test/ws-sandbox.php/1.0/referensi/wilayah?id_level_wilayah=0",
    );
    expect(requestInit.redirect).toBe("error");
    expect((requestInit.headers as Record<string, string>).Authorization).toBe(
      "Bearer secret-token",
    );
  });

  it("keeps the HTTP status when the gateway answers an error as text/plain", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "tok", role: "WS-BASIC", expires_at: 0 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("upstream connect error", {
          status: 503,
          headers: { "content-type": "text/plain" },
        }),
      ),
    );

    await expect(
      sisterGet({ path: "/referensi/semester", schema: itemSchema }),
    ).rejects.toMatchObject({ name: "SisterApiError", status: 503, safeCode: "SISTER_HTTP_503" });
  });

  it("throws a contract error on 204, non-JSON, or unparseable bodies", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "tok", role: "WS-BASIC", expires_at: 0 });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(sisterGet({ path: "/referensi/semester", schema: itemSchema })).rejects.toThrow(
      SisterContractError,
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } }),
      ),
    );
    await expect(sisterGet({ path: "/referensi/semester", schema: itemSchema })).rejects.toThrow(
      SisterContractError,
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not json", { status: 200, headers: { "content-type": "application/json" } }),
      ),
    );
    await expect(sisterGet({ path: "/referensi/semester", schema: itemSchema })).rejects.toThrow(
      SisterContractError,
    );
  });

  it("throws SisterApiError with the response status on a non-2xx response", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "tok", role: "WS-BASIC", expires_at: 0 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(403, { message: "Forbidden by SISTER" })),
    );

    const error = await sisterGet({ path: "/referensi/semester", schema: itemSchema }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(SisterApiError);
    expect((error as SisterApiError).status).toBe(403);
    expect((error as SisterApiError).message).toBe("Forbidden by SISTER");
  });

  it("throws a contract error when the response does not match the documented schema", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "tok", role: "WS-BASIC", expires_at: 0 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, [{ id: 123 }])));

    await expect(sisterGet({ path: "/referensi/semester", schema: itemSchema })).rejects.toThrow(
      SisterContractError,
    );
  });

  it("retries a GET that fails at the network level and succeeds once fetch recovers", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "tok", role: "WS-BASIC", expires_at: 0 });
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network error"))
      .mockRejectedValueOnce(new TypeError("network error"))
      .mockResolvedValueOnce(jsonResponse(200, [{ id: "1" }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sisterGet({ path: "/referensi/semester", schema: itemSchema });

    expect(result).toEqual([{ id: "1" }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  }, 10_000);

  it("gives up after the bounded number of network-level retries", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "tok", role: "WS-BASIC", expires_at: 0 });
    const networkError = new TypeError("network error");
    const fetchMock = vi.fn().mockRejectedValue(networkError);
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sisterGet({ path: "/referensi/semester", schema: itemSchema }),
    ).rejects.toThrow("network error");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  }, 10_000);

  it("does not retry once a response is actually received, even a non-2xx one", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "tok", role: "WS-BASIC", expires_at: 0 });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(500, { message: "Server error" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sisterGet({ path: "/referensi/semester", schema: itemSchema }),
    ).rejects.toBeInstanceOf(SisterApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("sisterGetFile", () => {
  it("passes allowlisted files through with a sanitized file name", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "tok", role: "WS-BASIC", expires_at: 0 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("%PDF", {
          status: 200,
          headers: {
            "content-type": "application/pdf; charset=binary",
            "content-disposition": String.raw`attachment; filename="../../SK \"Tugas\".pdf"`,
          },
        }),
      ),
    );

    const file = await sisterGetFile("/dokumen/abc/download");
    expect(file.contentType).toBe("application/pdf");
    expect(file.fileName).toBe("SK _Tugas_.pdf");
    expect(file.body.byteLength).toBe(4);
  });

  it("rejects content types outside the allowlist and oversized files", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "tok", role: "WS-BASIC", expires_at: 0 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<script>", { status: 200, headers: { "content-type": "text/html" } })),
    );
    await expect(sisterGetFile("/dokumen/abc/download")).rejects.toBeInstanceOf(SisterContractError);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("x", {
          status: 200,
          headers: { "content-type": "image/jpeg", "content-length": String(sisterFileMaxBytes + 1) },
        }),
      ),
    );
    await expect(sisterGetFile("/data_pribadi/foto/abc")).rejects.toBeInstanceOf(SisterContractError);
  });

  it("keeps the HTTP status of a failed download", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    getSisterTokenMock.mockResolvedValue({ token: "tok", role: "WS-BASIC", expires_at: 0 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 404, headers: { "content-type": "application/json" } })),
    );
    await expect(sisterGetFile("/dokumen/abc/download")).rejects.toMatchObject({ status: 404 });
  });
});
