import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSisterConfigMock = vi.hoisted(() => vi.fn());

vi.mock("./config", () => ({
  getSisterConfig: getSisterConfigMock,
}));

import { clearSisterTokenCache, getSisterToken } from "./token_provider";
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

function authorizeResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  clearSisterTokenCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  getSisterConfigMock.mockReset();
});

describe("getSisterToken", () => {
  it("authorizes against /authorize and caches the token for roughly 60 minutes", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(authorizeResponse(200, { token: "tok-1", role: "WS-BASIC" }));
    vi.stubGlobal("fetch", fetchMock);

    const before = Date.now();
    const token = await getSisterToken();
    const after = Date.now();

    expect(token.token).toBe("tok-1");
    expect(token.role).toBe("WS-BASIC");
    expect(token.expires_at).toBeGreaterThanOrEqual(before + 60 * 60 * 1000);
    expect(token.expires_at).toBeLessThanOrEqual(after + 60 * 60 * 1000);

    const [requestUrl, requestInit] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(requestUrl.toString()).toBe(
      "https://sister.example.test/ws-sandbox.php/1.0/authorize",
    );
    expect(requestInit.method).toBe("POST");
    expect(requestInit.redirect).toBe("error");
    expect(JSON.parse(requestInit.body as string)).toEqual({
      username: "user",
      password: "pass",
      id_pengguna: "user-1",
    });
  });

  it("reuses the cached token instead of calling /authorize again", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(authorizeResponse(200, { token: "tok-1", role: "WS-BASIC" }));
    vi.stubGlobal("fetch", fetchMock);

    await getSisterToken();
    await getSisterToken();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent callers into a single in-flight /authorize request", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(authorizeResponse(200, { token: "tok-1", role: "WS-BASIC" }));
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([getSisterToken(), getSisterToken()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.token).toBe("tok-1");
    expect(second.token).toBe("tok-1");
  });

  it("refuses to authorize when fixture mode is on or credentials are missing", async () => {
    getSisterConfigMock.mockReturnValue({ ...liveConfig, fixture_mode: true });
    await expect(getSisterToken()).rejects.toThrow("SISTER live authorization is not enabled");

    getSisterConfigMock.mockReturnValue({ ...liveConfig, base_url: null });
    await expect(getSisterToken()).rejects.toThrow("SISTER live authorization is not enabled");
  });

  it("throws SisterApiError when /authorize responds with a non-2xx status", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(authorizeResponse(401, { message: "Invalid credentials" })),
    );

    await expect(getSisterToken()).rejects.toBeInstanceOf(SisterApiError);
  });

  it("throws a contract error when the authorize response body is not JSON or does not match the schema", async () => {
    getSisterConfigMock.mockReturnValue(liveConfig);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not json", { status: 200, headers: { "content-type": "application/json" } }),
      ),
    );
    await expect(getSisterToken()).rejects.toBeInstanceOf(SisterContractError);

    clearSisterTokenCache();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(authorizeResponse(200, { role: "WS-BASIC" })));
    await expect(getSisterToken()).rejects.toBeInstanceOf(SisterContractError);
  });
});
