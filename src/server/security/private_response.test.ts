import { expect, it } from "vitest";
import { withPrivateResponsePolicy } from "./private_response";

it("makes success, error and batch responses private and non-cacheable", async () => {
  for (const status of [200, 207, 401, 403, 500]) {
    const response = withPrivateResponsePolicy(new Response("sensitive DTO", {
      status, headers: { "cache-control": "public, max-age=600", vary: "Accept-Encoding", "content-type": "application/json" },
    }), "safe-request-id");
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.headers.get("expires")).toBe("0");
    expect(response.headers.get("vary")).toBe("Accept-Encoding, Cookie");
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("x-request-id")).toBe("safe-request-id");
    expect(await response.text()).toBe("sensitive DTO");
  }
});

it.each(["cookie", "Cookie, Accept-Encoding", "*"])("preserves an existing Vary boundary %s without duplicates", vary => {
  const response = withPrivateResponsePolicy(new Response(null, { headers: { vary } }), "request");
  expect(response.headers.get("vary")).toBe(vary);
});

it("preserves cookies and unrelated security headers", () => {
  const response = withPrivateResponsePolicy(new Response(null, { headers: {
    "set-cookie": "synthetic=opaque; HttpOnly; SameSite=Lax",
    "content-security-policy": "default-src 'none'",
  } }), "request");
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  expect(response.headers.get("content-security-policy")).toBe("default-src 'none'");
});
