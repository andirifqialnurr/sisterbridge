import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { getSisterConfig } from "@/server/sister/config";
import { sdmListEndpoints } from "./replica_catalog";

type Client = Pick<PrismaClient, "sisterReplicaRecord" | "$queryRawUnsafe">;

// Only documented SDM detail endpoints can prove ownership of their explicit
// dokumen[] attachments. Teaching/class files use the stricter PT proof below.
const attachmentDetails = sdmListEndpoints.flatMap(list =>
  list.children?.filter(child => child.path === `${list.path}/{id}` && !child.follow)
    .map(child => child.path) ?? [],
);

async function hasOwnedDocumentMetadata(client: Client, integrationId: string, id: string) {
  // One document can occur under multiple SDM scopes. Any currently valid
  // ownership chain suffices; a retired first match must not hide another one.
  const rows = await client.$queryRawUnsafe<{ allowed: boolean }[]>(
    `SELECT EXISTS (
       SELECT 1 FROM sister_replica_record d
       JOIN sister_replica_record s ON s.integration_id=d.integration_id
        AND s.endpoint='/referensi/sdm' AND s.scope_key='-'
        AND s.item_key=d.id_sdm AND s.deleted_at IS NULL
       WHERE d.integration_id=$1::uuid AND d.endpoint='/dokumen' AND d.item_key=$2
         AND d.deleted_at IS NULL AND d.scope_key='id_sdm='||d.id_sdm
     ) AS allowed`, integrationId, id,
  );
  return rows[0]?.allowed === true;
}

async function hasOwnedClassDocument(client: Client, integrationId: string, id: string) {
  const rows = await client.$queryRawUnsafe<{ allowed: boolean }[]>(
    `WITH own_pt AS (
       SELECT COALESCE(payload_json->>'id_perguruan_tinggi', payload_json->>'id') AS id
         FROM sister_replica_record WHERE integration_id=$1::uuid
          AND endpoint='/referensi/profil_pt' AND scope_key='-' AND deleted_at IS NULL
     )
     SELECT EXISTS (
       SELECT 1 FROM sister_replica_record c
       JOIN sister_replica_record d ON d.integration_id=c.integration_id
        AND d.endpoint='/pengajaran/{id}' AND d.deleted_at IS NULL
        AND d.scope_key='id='||d.parent_id
        AND d.payload_json->>'id_kelas'=c.parent_id
       JOIN own_pt pt ON d.payload_json->>'id_pt'=pt.id
       JOIN sister_replica_record p ON p.integration_id=d.integration_id
        AND p.endpoint='/pengajaran' AND p.item_key=d.parent_id AND p.deleted_at IS NULL
        AND p.scope_key='id_sdm='||p.id_sdm
       JOIN sister_replica_record s ON s.integration_id=p.integration_id
        AND s.endpoint='/referensi/sdm' AND s.scope_key='-'
        AND s.item_key=p.id_sdm AND s.deleted_at IS NULL
       WHERE c.integration_id=$1::uuid AND c.endpoint='/kelas_kuliah/{id}/dokumen'
         AND c.item_key=$2 AND c.deleted_at IS NULL AND c.scope_key='id='||c.parent_id
         AND (SELECT count(*) FROM own_pt)=1
         AND pt.id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
     ) AS allowed`, integrationId, id,
  );
  return rows[0]?.allowed === true;
}

async function hasOwnedActivityAttachment(client: Client, integrationId: string, id: string) {
  const rows = await client.$queryRawUnsafe<{ allowed: boolean }[]>(
    `SELECT EXISTS (
       SELECT 1 FROM sister_replica_record d
       JOIN sister_replica_record p ON p.integration_id=d.integration_id
        AND p.endpoint=left(d.endpoint,length(d.endpoint)-5)
        AND p.item_key=d.parent_id AND p.deleted_at IS NULL
        AND p.scope_key='id_sdm='||p.id_sdm
       JOIN sister_replica_record s ON s.integration_id=p.integration_id
        AND s.endpoint='/referensi/sdm' AND s.scope_key='-'
        AND s.item_key=p.id_sdm AND s.deleted_at IS NULL
       WHERE d.integration_id=$1::uuid AND d.endpoint=ANY($2::text[]) AND d.deleted_at IS NULL
         AND d.scope_key='id='||d.parent_id
         AND (d.payload_json @> $3::jsonb OR d.payload_json @> $4::jsonb)
     ) AS allowed`, integrationId, attachmentDetails,
    JSON.stringify({ dokumen: [{ id }] }), JSON.stringify({ dokumen: [{ id_dokumen: id }] }),
  );
  return rows[0]?.allowed === true;
}

// Membership is required in addition to role and live upstream authorization.
// Unknown, orphaned, retired or foreign IDs fail closed. Neither a browser's
// parent ID nor an arbitrary URL/JSON field can grant file access.
export async function hasSisterFileAccess(
  kind: "foto" | "dokumen",
  id: string,
  client: Client = prisma,
): Promise<boolean> {
  const config = getSisterConfig();
  if (!config.integration_id || config.fixture_mode) return false;
  const integrationId = config.integration_id;

  async function activeSdm(idSdm: string) {
    return await client.sisterReplicaRecord.findFirst({
      where: { integrationId, endpoint: "/referensi/sdm", scopeKey: "-", itemKey: idSdm, deletedAt: null },
      select: { itemKey: true },
    }) !== null;
  }
  if (kind === "foto") return activeSdm(id);

  if (await hasOwnedDocumentMetadata(client, integrationId, id)) return true;
  if (await hasOwnedClassDocument(client, integrationId, id)) return true;
  return hasOwnedActivityAttachment(client, integrationId, id);
}
