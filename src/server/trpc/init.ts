import { initTRPC, TRPCError } from "@trpc/server";

import { recordSecurityAuditEvent } from "@/server/security/audit";

import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = publicProcedure.use(async ({ ctx, next, path }) => {
  if (!ctx.user) {
    void recordSecurityAuditEvent({
      event_type: "authorization_denied",
      severity: "MEDIUM",
      outcome: "DENIED",
      request_id: ctx.requestId,
      route_or_procedure: path,
      metadata: {
        reason: "missing_session",
        method: ctx.request.method,
      },
    });

    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication is required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next, path }) => {
  if (ctx.user.role !== "ADMIN") {
    void recordSecurityAuditEvent({
      event_type: "authorization_denied",
      severity: "HIGH",
      outcome: "DENIED",
      actor_user_id: ctx.user.id,
      request_id: ctx.requestId,
      route_or_procedure: path,
      metadata: {
        reason: "role_not_allowed",
        required_role: "ADMIN",
        actual_role: ctx.user.role,
      },
    });

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Akses audit security membutuhkan role ADMIN",
    });
  }

  return next();
});

// Raw SISTER data (e.g. the live explorer) is limited to roles that operate
// the integration.
export const operatorProcedure = protectedProcedure.use(async ({ ctx, next, path }) => {
  if (ctx.user.role !== "ADMIN" && ctx.user.role !== "OPERATOR") {
    void recordSecurityAuditEvent({
      event_type: "authorization_denied",
      severity: "MEDIUM",
      outcome: "DENIED",
      actor_user_id: ctx.user.id,
      request_id: ctx.requestId,
      route_or_procedure: path,
      metadata: {
        reason: "role_not_allowed",
        required_role: "OPERATOR",
        actual_role: ctx.user.role,
      },
    });

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Jelajah data SISTER membutuhkan role ADMIN atau OPERATOR",
    });
  }

  return next();
});
