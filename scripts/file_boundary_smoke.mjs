// Local real-session file ownership QA. Creates a temporary user + a disabled
// sibling integration with synthetic records; finally removes only QA data.
// Audit events are retained. Existing accounts/replica records are not changed.
// Optional FILE_SMOKE_ALLOW_LIVE=1 downloads one owned photo plus metadata,
// class and activity document samples into memory only. For that mode the local server MUST use the sandbox base URL.
// UI_SMOKE_CREATE_TEMP_ADMIN=1 bun scripts/file_boundary_smoke.mjs
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { auditDocumentOwnershipRelations } from "./lib/document_relation_fixture.mjs";
import { hasSisterFileAccess } from "../src/server/sister/replica/file_access_repository.ts";

assert.equal(process.env.UI_SMOKE_CREATE_TEMP_ADMIN, "1", "Temporary account creation requires explicit opt-in");
const base = new URL(process.env.UI_SMOKE_BASE_URL ?? "http://localhost:2703");
assert(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Local application hosts only");
const integrationId = process.env.SISTER_INTEGRATION_ID;
assert(integrationId, "A local replica integration is required");
const live = process.env.FILE_SMOKE_ALLOW_LIVE === "1";
if (live) assert(process.env.SISTER_BASE_URL_DEV?.includes("sandbox"), "Sandbox configuration required for live file probes");
const prisma = new PrismaClient();
const userId = randomUUID();
const siblingId = randomUUID();
const foreignSdm = randomUUID();
const foreignDoc = randomUUID();
const retiredSdm = randomUUID();
const retiredDoc = randomUUID();
const qaScope = `file-qa-${randomUUID()}`;
const email = `ui-qa-${userId}@example.invalid`;
const password = randomBytes(32).toString("base64url");
let created = false;
let siblingCreated = false;
let cookie;
try {
  assert.equal((await fetch(new URL("/login", base), { signal: AbortSignal.timeout(10000) })).status, 200);
  await prisma.appUser.create({ data: {
    id: userId, email, name: "Temporary File QA", role: "ADMIN", isActive: true, emailVerified: true,
    authAccounts: { create: { id: randomUUID(), accountId: userId, providerId: "credential", password: await hashPassword(password) } },
  } });
  created = true;
  await prisma.sisterIntegration.create({ data: {
    id: siblingId, baseUrl: "https://sister.invalid/qa-disabled", credentialRef: "temporary-file-qa", isEnabled: false,
    replicaRecords: { create: [
      { endpoint: "/referensi/sdm", scopeKey: qaScope, itemKey: foreignSdm, payloadJson: {}, payloadHash: "qa" },
      { endpoint: "/dokumen", scopeKey: qaScope, itemKey: foreignDoc, idSdm: foreignSdm, payloadJson: {}, payloadHash: "qa" },
    ] },
  } });
  siblingCreated = true;
  await prisma.sisterReplicaRecord.createMany({ data: [
    { integrationId, endpoint: "/referensi/sdm", scopeKey: qaScope, itemKey: retiredSdm, deletedAt: new Date(), payloadJson: {}, payloadHash: "qa" },
    { integrationId, endpoint: "/dokumen", scopeKey: qaScope, itemKey: retiredDoc, idSdm: retiredSdm, deletedAt: new Date(), payloadJson: {}, payloadHash: "qa" },
  ] });
  const login = await fetch(new URL("/api/auth/sign-in/email", base), {
    method: "POST", headers: { "content-type": "application/json", origin: base.origin },
    body: JSON.stringify({ email, password }), signal: AbortSignal.timeout(15000),
  });
  assert.equal(login.status, 200, "Normal sign-in required");
  cookie = login.headers.getSetCookie().map(value => value.split(";", 1)[0]).join("; ");
  await login.body?.cancel();
  assert(cookie, "Session cookie required");
  async function file(kind, id) {
    return fetch(new URL(`/api/sister/file/${kind}/${id}`, base), { headers: { cookie }, redirect: "manual", signal: AbortSignal.timeout(90000) });
  }
  for (const role of ["ADMIN", "OPERATOR", "REVIEWER", "VIEWER"]) {
    await prisma.appUser.update({ where: { id: userId }, data: { role } });
    for (const [kind, id] of [["foto", foreignSdm], ["dokumen", foreignDoc], ["foto", retiredSdm], ["dokumen", retiredDoc]]) {
      const response = await file(kind, id);
      const roleDenied = kind === "dokumen" && ["REVIEWER", "VIEWER"].includes(role);
      assert.equal(response.status, roleDenied ? 403 : 404, `Role/ownership boundary: ${role}/${kind}`);
      assert.equal(response.headers.get("cache-control"), "no-store");
      const body = await response.json();
      assert.equal(body.message, roleDenied ? "Role ini tidak dapat membuka file SISTER" : "File tidak tersedia pada integrasi aktif");
    }
  }
  console.log(JSON.stringify({ check: "real-session-file-role-tenant-and-soft-delete-boundaries", roles: 4, requests: 16, passed: true }));

  await auditDocumentOwnershipRelations(prisma, integrationId, siblingId);
  console.log(JSON.stringify({ check: "document-parent-and-own-PT-proof-sql", fixturesRolledBack: true, upstreamRequests: 0, passed: true }));

  if (live) {
    await prisma.appUser.update({ where: { id: userId }, data: { role: "ADMIN" } });
    const photo = await prisma.sisterReplicaRecord.findFirst({ where: { integrationId, endpoint: "/referensi/sdm", deletedAt: null }, select: { itemKey: true } });
    const documents = await prisma.$queryRawUnsafe(
      `SELECT d.item_key AS "itemKey" FROM sister_replica_record d
        JOIN sister_replica_record s ON s.integration_id=d.integration_id
         AND s.endpoint=$2 AND s.item_key=d.id_sdm AND s.deleted_at IS NULL
       WHERE d.integration_id=$1::uuid AND d.endpoint=$3 AND d.deleted_at IS NULL LIMIT 1`,
      integrationId, "/referensi/sdm", "/dokumen",
    );
    const classes = await prisma.sisterReplicaRecord.findMany({
      where: { integrationId, endpoint: "/kelas_kuliah/{id}/dokumen", deletedAt: null }, select: { itemKey: true }, take: 20,
    });
    const attachments = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(j->>'id',j->>'id_dokumen') AS "itemKey"
         FROM sister_replica_record d CROSS JOIN LATERAL jsonb_array_elements(
           CASE WHEN jsonb_typeof(d.payload_json->'dokumen')='array'
             THEN d.payload_json->'dokumen' ELSE '[]'::jsonb END) j
        WHERE d.integration_id=$1::uuid AND d.endpoint='/penelitian/{id}' AND d.deleted_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM sister_replica_record m WHERE m.integration_id=d.integration_id
            AND m.endpoint IN ('/dokumen','/kelas_kuliah/{id}/dokumen') AND m.deleted_at IS NULL
            AND m.item_key=COALESCE(j->>'id',j->>'id_dokumen')) LIMIT 20`, integrationId,
    );
    async function permitted(candidates) {
      for (const candidate of candidates) {
        if (z.string().uuid().safeParse(candidate.itemKey).success && await hasSisterFileAccess("dokumen", candidate.itemKey, prisma)) return candidate.itemKey;
      }
      return null;
    }
    const classId = await permitted(classes);
    const attachmentId = await permitted(attachments);
    assert(photo && documents[0] && classId && attachmentId, "Owned photo/metadata/class/activity samples required");
    let unavailable = 0;
    for (const [kind, id, source] of [["foto", photo.itemKey, "sdm"], ["dokumen", documents[0].itemKey, "metadata"], ["dokumen", classId, "owned-class"], ["dokumen", attachmentId, "owned-activity"]]) {
      const response = await file(kind, id);
      if (response.status !== 200) {
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.equal(response.headers.get("content-security-policy"), "sandbox; default-src 'none'");
        const error = await response.json().catch(() => ({}));
        const upstream = String(error.message ?? "").match(/HTTP (\d{3})/);
        unavailable += 1;
        console.log(JSON.stringify({ check: "owned-sandbox-file", kind, source, status: response.status, upstreamStatus: upstream ? Number(upstream[1]) : null, state: "unavailable", savedToDisk: false }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.equal(response.headers.get("content-security-policy"), "sandbox; default-src 'none'");
      assert(response.headers.get("content-disposition")?.startsWith(kind === "foto" ? "inline;" : "attachment;"));
      const bytes = (await response.arrayBuffer()).byteLength;
      assert(bytes > 0 && bytes <= 25 * 1024 * 1024);
      console.log(JSON.stringify({ check: "owned-sandbox-file", kind, source, status: response.status, contentType: response.headers.get("content-type"), bytes, savedToDisk: false }));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (unavailable) process.exitCode = 1;
  }
} finally {
  // Separate cleanup attempts ensure a failed account delete cannot leave QA
  // replica rows behind. Never delete or rewrite security audit events.
  try {
    await prisma.sisterReplicaRecord.deleteMany({ where: { integrationId, scopeKey: qaScope } });
  } finally {
    try {
      if (siblingCreated) await prisma.sisterIntegration.delete({ where: { id: siblingId } });
    } finally {
      try {
        if (created) await prisma.appUser.delete({ where: { id: userId } });
        console.log(JSON.stringify({ cleanup: "temporary account, sessions, sibling integration and QA records removed; audit retained" }));
      } finally { await prisma.$disconnect(); }
    }
  }
}
