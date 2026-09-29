import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Optimistic page guard: redirects to /login when no session cookie is
// present. The real check happens server-side in the tRPC context
// (getCurrentUser), which validates the session against the database.
export function middleware(request: NextRequest) {
  const fixtureSession =
    process.env.NODE_ENV !== "production" && process.env.SISTER_FIXTURE_MODE !== "false";
  if (fixtureSession || getSessionCookie(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (next !== "/") {
    loginUrl.searchParams.set("next", next);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Everything except the login page, the auth and tRPC APIs (they answer
  // 401 themselves), Next internals, and static files.
  matcher: ["/((?!login|api/|_next/|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
