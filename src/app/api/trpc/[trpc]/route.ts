import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { recordSecurityAuditEvent } from "@/server/security/audit";
import { withPrivateResponsePolicy } from "@/server/security/private_response";
import {
  makePolicyResponse,
  prepareTrpcRequest,
} from "@/server/security/request_policy";
import { createTRPCContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";

const handler = async (request: Request) => {
  const prepared = await prepareTrpcRequest(request);
  if (prepared.rejection) {
    void recordSecurityAuditEvent({
      event_type: prepared.rejection.event_type,
      severity: prepared.rejection.status === 429 ? "LOW" : "MEDIUM",
      outcome: prepared.rejection.status === 429 ? "BLOCKED" : "DENIED",
      request_id: prepared.request_id,
      route_or_procedure: "api.trpc",
      metadata: {
        method: request.method,
        status: prepared.rejection.status,
      },
    });

    return makePolicyResponse(
      prepared.rejection,
      prepared.request_id,
      prepared.rate_limit,
    );
  }

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: prepared.request,
    router: appRouter,
    createContext: createTRPCContext,
  });
  return withPrivateResponsePolicy(response, prepared.request_id);
};

export { handler as GET, handler as POST };
