import { z } from "zod";

const optionalText = z.string().trim().min(1).optional();

const sisterEnvironmentSchema = z.object({
  SISTER_BASE_URL: optionalText,
  SISTER_BASE_URL_DEV: optionalText,
  SISTER_ID_PENGGUNA: optionalText,
  SISTER_INTEGRATION_ID: optionalText,
  SISTER_USERNAME: optionalText,
  SISTER_PASSWORD: optionalText,
  SISTER_CREDENTIAL_REF: optionalText,
});

export type SisterConfig = {
  fixture_mode: boolean;
  base_url: string | null;
  id_pengguna: string | null;
  integration_id: string | null;
  username: string | null;
  password: string | null;
  credential_ref: string | null;
  sdm_cache_ttl_ms: number;
};

export type SisterConfigurationStatus = {
  mode: "fixture" | "live";
  configuration: "ready" | "incomplete";
};

const defaultSdmCacheTtlMs = 5 * 60 * 1000;

function getSdmCacheTtlMs() {
  const seconds = Number(process.env.SISTER_SDM_CACHE_TTL_SECONDS);
  if (Number.isSafeInteger(seconds) && seconds >= 30 && seconds <= 24 * 60 * 60) {
    return seconds * 1000;
  }

  return defaultSdmCacheTtlMs;
}

// Production always talks to SISTER_BASE_URL. Outside production the sandbox
// (SISTER_BASE_URL_DEV) wins when it is configured, so a laptop or CI run never
// reaches the production web service by accident.
function resolveBaseUrl(environment: z.infer<typeof sisterEnvironmentSchema>) {
  if (process.env.NODE_ENV !== "production" && environment.SISTER_BASE_URL_DEV) {
    return environment.SISTER_BASE_URL_DEV;
  }

  return environment.SISTER_BASE_URL;
}

export function getSisterConfig(): SisterConfig {
  const environment = sisterEnvironmentSchema.parse(process.env);
  const fixtureMode =
    process.env.NODE_ENV !== "production" &&
    process.env.SISTER_FIXTURE_MODE !== "false";

  if (fixtureMode) {
    return {
      fixture_mode: true,
      base_url: resolveBaseUrl(environment) ?? null,
      id_pengguna: environment.SISTER_ID_PENGGUNA ?? null,
      integration_id: environment.SISTER_INTEGRATION_ID ?? null,
      username: null,
      password: null,
      credential_ref: environment.SISTER_CREDENTIAL_REF ?? null,
      sdm_cache_ttl_ms: getSdmCacheTtlMs(),
    };
  }

  const baseUrl = resolveBaseUrl(environment);
  if (!baseUrl) {
    throw new Error("SISTER configuration is incomplete: base URL is required");
  }

  const parsedBaseUrl = new URL(baseUrl);
  if (parsedBaseUrl.protocol !== "https:") {
    throw new Error("SISTER configuration requires an HTTPS base URL");
  }

  if (!environment.SISTER_ID_PENGGUNA) {
    throw new Error("SISTER configuration is incomplete: id_pengguna is required");
  }

  if (!environment.SISTER_USERNAME || !environment.SISTER_PASSWORD) {
    throw new Error("SISTER credentials are not configured");
  }

  if (
    environment.SISTER_INTEGRATION_ID &&
    !z.string().uuid().safeParse(environment.SISTER_INTEGRATION_ID).success
  ) {
    throw new Error("SISTER integration ID must be a valid UUID");
  }

  return {
    fixture_mode: false,
    base_url: parsedBaseUrl.toString(),
    id_pengguna: environment.SISTER_ID_PENGGUNA,
    integration_id: environment.SISTER_INTEGRATION_ID ?? null,
    username: environment.SISTER_USERNAME,
    password: environment.SISTER_PASSWORD,
    credential_ref: environment.SISTER_CREDENTIAL_REF ?? null,
    sdm_cache_ttl_ms: getSdmCacheTtlMs(),
  };
}

export function getSisterConfigurationStatus(): SisterConfigurationStatus {
  const fixtureMode =
    process.env.NODE_ENV !== "production" &&
    process.env.SISTER_FIXTURE_MODE !== "false";

  if (fixtureMode) {
    return { mode: "fixture", configuration: "ready" };
  }

  try {
    getSisterConfig();
    return { mode: "live", configuration: "ready" };
  } catch {
    return { mode: "live", configuration: "incomplete" };
  }
}
