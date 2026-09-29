"use client";

import { createAuthClient } from "better-auth/react";

// Talks to /api/auth on the same origin; the session lives in an HttpOnly
// cookie, so no token is ever readable from the browser.
export const authClient = createAuthClient();
