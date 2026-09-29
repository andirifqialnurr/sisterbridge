import { getCurrentUser, type AppSessionUser } from "@/server/auth/session";
import { getSafeRequestId } from "@/server/security/request_policy";

export type TrpcContext = {
  requestId: string;
  request: Request;
  user: AppSessionUser | null;
};

export async function createTRPCContext({
  req,
}: {
  req: Request;
}): Promise<TrpcContext> {
  return {
    requestId: getSafeRequestId(req),
    request: req,
    user: await getCurrentUser(req.headers),
  };
}
