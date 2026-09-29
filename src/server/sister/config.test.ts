import { afterEach, describe, expect, it, vi } from "vitest";

import { getSisterConfig, getSisterConfigurationStatus } from "./config";

const environmentKeys = [
  "SISTER_FIXTURE_MODE",
  "SISTER_BASE_URL",
  "SISTER_BASE_URL_DEV",
  "SISTER_ID_PENGGUNA",
  "SISTER_USERNAME",
  "SISTER_PASSWORD",
  "SISTER_INTEGRATION_ID",
  "SISTER_SDM_CACHE_TTL_SECONDS",
] as const;

const originalEnvironment = Object.fromEntries(
  environmentKeys.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const key of environmentKeys) {
    const value = originalEnvironment[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("SISTER configuration status", () => {
  it("reports fixture mode without exposing configuration values", () => {
    process.env.SISTER_FIXTURE_MODE = "true";
    process.env.SISTER_PASSWORD = "should-not-be-returned";

    expect(getSisterConfigurationStatus()).toEqual({
      mode: "fixture",
      configuration: "ready",
    });
  });

  it("reports incomplete live configuration without throwing to the status UI", () => {
    process.env.SISTER_FIXTURE_MODE = "false";
    delete process.env.SISTER_BASE_URL;
    delete process.env.SISTER_ID_PENGGUNA;
    delete process.env.SISTER_USERNAME;
    delete process.env.SISTER_PASSWORD;

    expect(getSisterConfigurationStatus()).toEqual({
      mode: "live",
      configuration: "incomplete",
    });
  });

  it("reports live configuration ready when the required values are present", () => {
    process.env.SISTER_FIXTURE_MODE = "false";
    process.env.SISTER_BASE_URL = "https://sister.example.test/";
    process.env.SISTER_ID_PENGGUNA = "pt-user-uat";
    process.env.SISTER_USERNAME = "uat-user";
    process.env.SISTER_PASSWORD = "uat-password";

    expect(getSisterConfigurationStatus()).toEqual({
      mode: "live",
      configuration: "ready",
    });
  });
});

describe("getSisterConfig", () => {
  function setLiveEnv(overrides: Record<string, string | undefined> = {}) {
    process.env.SISTER_FIXTURE_MODE = "false";
    process.env.SISTER_BASE_URL = "https://sister.example.test/";
    delete process.env.SISTER_BASE_URL_DEV;
    process.env.SISTER_ID_PENGGUNA = "pt-user-uat";
    process.env.SISTER_USERNAME = "uat-user";
    process.env.SISTER_PASSWORD = "uat-password";
    delete process.env.SISTER_INTEGRATION_ID;

    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }

  it("rejects a non-HTTPS base URL", () => {
    setLiveEnv({ SISTER_BASE_URL: "http://sister.example.test/" });

    expect(() => getSisterConfig()).toThrow("SISTER configuration requires an HTTPS base URL");
  });

  it("requires id_pengguna and credentials", () => {
    setLiveEnv({ SISTER_ID_PENGGUNA: undefined });
    expect(() => getSisterConfig()).toThrow("id_pengguna is required");

    setLiveEnv({ SISTER_USERNAME: undefined });
    expect(() => getSisterConfig()).toThrow("credentials are not configured");
  });

  it("rejects an integration ID that is not a valid UUID", () => {
    setLiveEnv({ SISTER_INTEGRATION_ID: "not-a-uuid" });

    expect(() => getSisterConfig()).toThrow("must be a valid UUID");
  });

  it("accepts a valid integration ID and normalizes the base URL", () => {
    setLiveEnv({ SISTER_INTEGRATION_ID: "11111111-1111-4111-8111-111111111111" });

    const config = getSisterConfig();

    expect(config.fixture_mode).toBe(false);
    expect(config.base_url).toBe("https://sister.example.test/");
    expect(config.integration_id).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("prefers the sandbox base URL outside production", () => {
    setLiveEnv({
      SISTER_BASE_URL: "https://sister.example.test/ws.php/1.0/",
      SISTER_BASE_URL_DEV: "https://sister.example.test/ws-sandbox.php/1.0/",
    });

    expect(getSisterConfig().base_url).toBe("https://sister.example.test/ws-sandbox.php/1.0/");
  });

  it("ignores the sandbox base URL in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      setLiveEnv({
        SISTER_BASE_URL: "https://sister.example.test/ws.php/1.0/",
        SISTER_BASE_URL_DEV: "https://sister.example.test/ws-sandbox.php/1.0/",
      });

      expect(getSisterConfig().base_url).toBe("https://sister.example.test/ws.php/1.0/");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("clamps sdm_cache_ttl_ms to the documented default when the env value is out of bounds", () => {
    setLiveEnv({ SISTER_SDM_CACHE_TTL_SECONDS: "5" });
    expect(getSisterConfig().sdm_cache_ttl_ms).toBe(5 * 60 * 1000);

    setLiveEnv({ SISTER_SDM_CACHE_TTL_SECONDS: "600" });
    expect(getSisterConfig().sdm_cache_ttl_ms).toBe(600 * 1000);
  });

  it("never returns username/password when fixture mode is active", () => {
    process.env.SISTER_FIXTURE_MODE = "true";
    process.env.SISTER_USERNAME = "should-not-be-returned";
    process.env.SISTER_PASSWORD = "should-not-be-returned";

    const config = getSisterConfig();

    expect(config.fixture_mode).toBe(true);
    expect(config.username).toBeNull();
    expect(config.password).toBeNull();
  });
});

