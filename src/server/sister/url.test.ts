import { describe, expect, it } from "vitest";

import { buildSisterUrl } from "./url";

const sandbox = "https://sister.example.test/ws-sandbox.php/1.0/";

describe("buildSisterUrl", () => {
  it("keeps the versioned base path with or without a trailing slash", () => {
    expect(buildSisterUrl(sandbox, "/referensi/sdm").toString()).toBe(
      "https://sister.example.test/ws-sandbox.php/1.0/referensi/sdm",
    );
    expect(
      buildSisterUrl("https://sister.example.test/ws-sandbox.php/1.0", "/authorize").toString(),
    ).toBe("https://sister.example.test/ws-sandbox.php/1.0/authorize");
  });

  it("adds defined, non-empty query values only", () => {
    const url = buildSisterUrl(sandbox, "/bkd/ajar", {
      id_sdm: "abc",
      id_smt: 20231,
      empty: "",
      missing: undefined,
    });
    expect(url.search).toBe("?id_sdm=abc&id_smt=20231");
  });

  it("rejects relative, protocol-relative, and escaping paths", () => {
    expect(() => buildSisterUrl(sandbox, "referensi/sdm")).toThrow("absolute API paths");
    expect(() => buildSisterUrl(sandbox, "//evil.example/x")).toThrow("unsafe URL");
    expect(() => buildSisterUrl(sandbox, "/../../ws.php/1.0/referensi/sdm")).toThrow("unsafe URL");
  });

  it("rejects a non-HTTPS base URL", () => {
    expect(() => buildSisterUrl("http://sister.example.test/ws.php/1.0/", "/authorize")).toThrow(
      "unsafe URL",
    );
  });
});
