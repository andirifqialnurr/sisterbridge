export type AppRole = "ADMIN" | "OPERATOR" | "REVIEWER" | "VIEWER";

export type AppSessionUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
};

const appRoles: readonly AppRole[] = ["ADMIN", "OPERATOR", "REVIEWER", "VIEWER"];

const developmentFixtureUser: AppSessionUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "developer@fixture.local",
  name: "Developer Fixture",
  role: "OPERATOR",
};

/**
 * Development-only seam: with synthetic SISTER fixtures and outside
 * production, every request acts as a fixture operator so the UI can be
 * worked on without accounts. Never active in production or live mode.
 */
export function getFixtureUser(): AppSessionUser | null {
  const fixtureEnabled = process.env.SISTER_FIXTURE_MODE !== "false";

  if (process.env.NODE_ENV !== "production" && fixtureEnabled) {
    return developmentFixtureUser;
  }

  return null;
}

type SessionLookup = (headers: Headers) => Promise<{
  user: { id: string; email: string; name: string; role?: unknown; isActive?: unknown };
} | null>;

const betterAuthLookup: SessionLookup = async (headers) => {
  const { auth } = await import("./auth");
  return auth.api.getSession({ headers });
};

// Resolves the application user from the request's better-auth session
// cookie. Inactive users and unknown roles resolve to no user.
export async function getCurrentUser(
  headers: Headers,
  lookup: SessionLookup = betterAuthLookup,
): Promise<AppSessionUser | null> {
  const fixtureUser = getFixtureUser();
  if (fixtureUser) {
    return fixtureUser;
  }

  let session: Awaited<ReturnType<SessionLookup>>;
  try {
    session = await lookup(headers);
  } catch {
    return null;
  }

  const user = session?.user;
  if (!user || user.isActive === false || !appRoles.includes(user.role as AppRole)) {
    return null;
  }

  return { id: user.id, email: user.email, name: user.name, role: user.role as AppRole };
}
