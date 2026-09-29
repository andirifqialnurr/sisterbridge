import { randomUUID } from "node:crypto";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/server/db/prisma";
import { recordSecurityAuditEvent } from "@/server/security/audit";

const sessionLifetimeSeconds = 8 * 60 * 60;
const sessionRefreshSeconds = 60 * 60;

function allowedOrigins() {
  return [process.env.APP_URL, ...(process.env.APP_ALLOWED_ORIGINS ?? "").split(",")]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));
}

// Local email + password login for application users (not SISTER
// credentials; see cookbook/security.md 4.3). Accounts are created by an
// admin with `bun run auth:create-user`; self sign-up is disabled.
export const auth = betterAuth({
  appName: "SISTER Console",
  baseURL: process.env.APP_URL,
  secret: process.env.SESSION_SECRET,
  trustedOrigins: allowedOrigins(),
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  user: {
    modelName: "appUser",
    additionalFields: {
      role: { type: "string", input: false, required: false, defaultValue: "VIEWER" },
      isActive: { type: "boolean", input: false, required: false, defaultValue: true },
    },
  },
  session: {
    modelName: "authSession",
    expiresIn: sessionLifetimeSeconds,
    updateAge: sessionRefreshSeconds,
  },
  account: { modelName: "authAccount" },
  verification: { modelName: "authVerification" },
  // Only email sign-in, sign-out, and session reads are needed.
  disabledPaths: [
    "/sign-up/email",
    "/request-password-reset",
    "/reset-password",
    "/send-verification-email",
    "/verify-email",
    "/change-email",
    "/update-user",
    "/delete-user",
  ],
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  },
  advanced: {
    database: { generateId: () => randomUUID() },
    useSecureCookies: process.env.APP_URL?.startsWith("https://") ?? false,
  },
  telemetry: { enabled: false },
  databaseHooks: {
    session: {
      create: {
        // Deactivated users cannot open new sessions.
        before: async (session) => {
          const user = await prisma.appUser.findUnique({
            where: { id: session.userId },
            select: { isActive: true },
          });
          return user?.isActive ? undefined : false;
        },
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email" && ctx.path !== "/sign-out") {
        return;
      }

      const failed = ctx.context.returned instanceof APIError;
      const session = ctx.context.newSession ?? ctx.context.session;
      void recordSecurityAuditEvent({
        event_type: ctx.path === "/sign-out" ? "auth_logout" : failed ? "auth_login_failed" : "auth_login",
        severity: failed ? "MEDIUM" : "INFO",
        outcome: failed ? "FAILED" : "SUCCESS",
        actor_user_id: session?.user.id ?? null,
        request_id: randomUUID(),
        route_or_procedure: `api.auth${ctx.path}`,
        metadata: failed ? { status: (ctx.context.returned as APIError).statusCode } : undefined,
      });
    }),
  },
  plugins: [nextCookies()],
});
