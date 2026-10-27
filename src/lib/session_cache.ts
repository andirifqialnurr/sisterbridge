import type { QueryClient } from "@tanstack/react-query";

type CacheSession = {
  user: { id: string; role?: unknown; isActive?: unknown };
  session?: { id?: string };
} | null | undefined;

// Do not use session tokens/cookies as cache identities. Role/activity changes
// invalidate data too, once the session client observes the updated session.
export function sessionCacheIdentity(session: CacheSession): string {
  if (!session?.user) return "anonymous";
  return JSON.stringify([
    session.user.id,
    session.session?.id ?? null,
    typeof session.user.role === "string" ? session.user.role : null,
    session.user.isActive !== false,
  ]);
}

export async function clearSessionQueryCache(client: QueryClient): Promise<void> {
  try {
    await client.cancelQueries(undefined, { silent: true });
    // clear() alone removes cache entries but can leave mounted observers
    // displaying their old result. Reset their state before removing entries.
    await client.resetQueries();
    await client.cancelQueries(undefined, { silent: true });
  } finally {
    // Includes query and mutation caches, even if cancellation itself failed.
    client.clear();
  }
}
