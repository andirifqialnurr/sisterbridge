import { getFixtureUser } from "@/server/auth/session";
import { getSisterConfigurationStatus } from "@/server/sister/config";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/trpc/init";

import { overviewSessionSchema, overviewStatusSchema } from "../schema/overview_schema";

export const overviewRouter = createTRPCRouter({
  health: publicProcedure.query(({ ctx }) => ({
    ok: true,
    app: "sister-integrated",
    request_id: ctx.requestId,
    sister_connected: false,
  })),
  session: protectedProcedure.query(({ ctx }) =>
    overviewSessionSchema.parse({ role: ctx.user.role }),
  ),
  status: protectedProcedure.query(({ ctx }) => {
    const sisterStatus = getSisterConfigurationStatus();

    return overviewStatusSchema.parse({
      request_id: ctx.requestId,
      checked_at: new Date().toISOString(),
      environment: process.env.NODE_ENV === "production" ? "production" : "development",
      auth_mode: getFixtureUser() ? "development_fixture" : "local_login",
      session_state: ctx.user ? "present" : "missing",
      database_state: process.env.DATABASE_URL?.trim()
        ? "configured"
        : "not_configured",
      sister_mode: sisterStatus.mode,
      sister_configuration: sisterStatus.configuration,
    });
  }),
});
