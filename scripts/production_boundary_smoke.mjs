// Run against a local `bun run build` + `next start` server (Node 22+).
// No login, credentials, database writes or upstream file downloads are used.
// UI_SMOKE_BASE_URL=http://localhost:2703 node scripts/production_boundary_smoke.mjs
import assert from "node:assert/strict";

const base = new URL(process.env.UI_SMOKE_BASE_URL ?? "http://localhost:2703");
assert(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Smoke testing is local-only");
async function request(path, headers) {
  return fetch(new URL(path, base), { redirect: "manual", headers, signal: AbortSignal.timeout(15000) });
}
function checkHeaders(response) {
  const csp = response.headers.get("content-security-policy") ?? "";
  assert(csp.includes("default-src 'self'"), "Same-origin CSP is required");
  assert(csp.includes("frame-ancestors 'none'"), "Frame embedding must be blocked");
  assert(!csp.includes("'unsafe-eval'"), "Production must forbid eval");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000; includeSubDomains");
  assert.equal(response.headers.get("x-powered-by"), null);
}
const login = await request("/login");
assert.equal(login.status, 200, "Production login page must render");
checkHeaders(login);
await login.body?.cancel();

for (const path of ["/", "/pegawai", "/pendidikan_formal/ajuan", "/replika", "/bkd", "/peringatan"]) {
  const response = await request(path);
  assert.equal(response.status, 307, "Unauthenticated pages must redirect");
  const destination = new URL(response.headers.get("location"), base);
  assert.equal(destination.origin, base.origin);
  assert.equal(destination.pathname, "/login");
  if (path !== "/") assert.equal(destination.searchParams.get("next"), path);
  await response.body?.cancel();
}
console.log(JSON.stringify({ check: "production-headers-and-page-auth", pages: 6, passed: true }));

const id = "00000000-0000-4000-8000-000000000000";
for (const kind of ["foto", "dokumen"]) {
  for (const headers of [undefined, { cookie: "better-auth.session_token=invalid" }]) {
    const response = await request(`/api/sister/file/${kind}/${id}`, headers);
    assert.equal(response.status, 401, "Files require a validated session");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert(response.headers.get("x-request-id"), "File denial must have a request ID");
    const body = await response.json();
    assert.deepEqual(body, { message: "Authentication is required" });
  }
}
console.log(JSON.stringify({ check: "production-file-auth", requests: 4, passed: true }));
console.log(JSON.stringify({ passed: true, scope: "unauthenticated production boundaries only; not authenticated ADMIN/tenant QA" }));
