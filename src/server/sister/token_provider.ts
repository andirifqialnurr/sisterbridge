import { getSisterConfig } from "./config";
import { SisterApiError, SisterContractError } from "./errors";
import { authorizeResponseSchema } from "./types";
import { buildSisterUrl } from "./url";

type SisterToken = {
  token: string;
  role: string;
  expires_at: number;
};

let cachedToken: SisterToken | null = null;
let tokenRequest: Promise<SisterToken> | null = null;

const tokenLifetimeMs = 60 * 60 * 1000;
const refreshSafetyWindowMs = 60 * 1000;

function buildAuthorizeUrl(baseUrl: string) {
  return buildSisterUrl(baseUrl, "/authorize");
}

async function authorize(): Promise<SisterToken> {
  const config = getSisterConfig();
  if (config.fixture_mode || !config.base_url || !config.id_pengguna) {
    throw new Error("SISTER live authorization is not enabled");
  }

  const response = await fetch(buildAuthorizeUrl(config.base_url), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      username: config.username,
      password: config.password,
      id_pengguna: config.id_pengguna,
    }),
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    throw new SisterContractError("SISTER authorize response is not JSON");
  }

  if (!response.ok) {
    throw new SisterApiError(response.status, "AUTHORIZE_FAILED");
  }

  const parsed = authorizeResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new SisterContractError("SISTER authorize response is invalid");
  }

  return {
    token: parsed.data.token,
    role: parsed.data.role,
    expires_at: Date.now() + tokenLifetimeMs,
  };
}

export async function getSisterToken() {
  if (cachedToken && cachedToken.expires_at - refreshSafetyWindowMs > Date.now()) {
    return cachedToken;
  }

  tokenRequest ??= authorize().finally(() => {
    tokenRequest = null;
  });

  cachedToken = await tokenRequest;
  return cachedToken;
}

export function clearSisterTokenCache() {
  cachedToken = null;
}
