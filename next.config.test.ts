import { expect, it } from "vitest";
import nextConfig from "./next.config";

it("overrides the app CSP with a sandbox policy for every file route", async () => {
  const rules = await nextConfig.headers!();
  const appIndex = rules.findIndex(rule => rule.source === "/(.*)");
  const fileIndex = rules.findIndex(rule => rule.source === "/api/sister/file/:path*");
  expect(appIndex).toBeGreaterThanOrEqual(0);
  expect(fileIndex).toBeGreaterThan(appIndex);
  expect(rules[fileIndex].headers).toContainEqual({ key: "Content-Security-Policy", value: "sandbox; default-src 'none'" });
  expect(rules[appIndex].headers).toContainEqual({ key: "X-Content-Type-Options", value: "nosniff" });
});
