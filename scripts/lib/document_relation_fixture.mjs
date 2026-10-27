// Real SQL ownership regressions, all within an intentionally rolled-back
// transaction. No source records are changed and no upstream file is fetched.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { hasSisterFileAccess } from "../../src/server/sister/replica/file_access_repository.ts";

class QaRollback extends Error {}

export async function auditDocumentOwnershipRelations(prisma, integrationId, siblingId) {
  const sdm = randomUUID();
  const activity = randomUUID();
  const attachment = randomUUID();
  const teaching = randomUUID();
  const classId = randomUUID();
  const classDocument = randomUUID();
  const foreignPt = randomUUID();
  const foreignSdm = randomUUID();
  const foreignParent = randomUUID();
  const foreignAttachment = randomUUID();
  const foreignClass = randomUUID();
  const foreignClassDocument = randomUUID();
  const retiredSdm = randomUUID();
  const sharedDocument = randomUUID();
  const foreignMetadata = randomUUID();
  const missingOwnerDocument = randomUUID();
  const wrongScopeDocument = randomUUID();
  const foreignIndexDocument = randomUUID();
  const allIds = [sdm, activity, attachment, teaching, classId, classDocument, foreignPt, foreignSdm, foreignParent, foreignAttachment, foreignClass, foreignClassDocument, retiredSdm, sharedDocument, foreignMetadata, missingOwnerDocument, wrongScopeDocument, foreignIndexDocument];
  const key = (endpoint, scopeKey, itemKey) => ({ integrationId_endpoint_scopeKey_itemKey: { integrationId, endpoint, scopeKey, itemKey } });
  try {
    await prisma.$transaction(async tx => {
      const profile = await tx.sisterReplicaRecord.findFirst({ where: {
        integrationId, endpoint: "/referensi/profil_pt", scopeKey: "-", deletedAt: null,
      }, select: { payloadJson: true } });
      const ownPt = profile?.payloadJson?.id_perguruan_tinggi ?? profile?.payloadJson?.id;
      assert(typeof ownPt === "string", "Own PT profile required for class ownership QA");
      const row = (endpoint, scopeKey, itemKey, payloadJson, extra = {}) => ({ integrationId, endpoint, scopeKey, itemKey, payloadJson, payloadHash: "qa", ...extra });
      await tx.sisterReplicaRecord.createMany({ data: [
        row("/referensi/sdm", "-", sdm, { id_sdm: sdm, nama_sdm: "Synthetic file QA" }),
        row("/referensi/sdm", "-", retiredSdm, { id_sdm: retiredSdm }, { deletedAt: new Date() }),
        row("/dokumen", `id_sdm=${retiredSdm}`, sharedDocument, { id: sharedDocument }, { idSdm: retiredSdm }),
        row("/dokumen", `id_sdm=${sdm}`, sharedDocument, { id: sharedDocument }, { idSdm: sdm }),
        row("/dokumen", `id_sdm=${foreignSdm}`, foreignMetadata, { id: foreignMetadata }, { integrationId: siblingId, idSdm: foreignSdm }),
        row("/dokumen", "-", missingOwnerDocument, { id: missingOwnerDocument }),
        row("/dokumen", `id_sdm=${foreignSdm}`, wrongScopeDocument, { id: wrongScopeDocument }, { idSdm: sdm }),
        row("/dokumen", `id_sdm=${foreignSdm}`, foreignIndexDocument, { id: foreignIndexDocument }, { idSdm: foreignSdm }),
        row("/penelitian", `id_sdm=${sdm}`, activity, { id: activity }, { idSdm: sdm }),
        row("/penelitian/{id}", `id=${activity}`, "self", { id: activity, dokumen: [{ id: attachment }] }, { parentId: activity, idSdm: sdm }),
        row("/pengajaran", `id_sdm=${sdm}`, teaching, { id: teaching }, { idSdm: sdm }),
        row("/pengajaran/{id}", `id=${teaching}`, "self", { id: teaching, id_kelas: classId, id_pt: foreignPt, dokumen: [{ id: classDocument }] }, { parentId: teaching, idSdm: sdm }),
        row("/kelas_kuliah/{id}/dokumen", `id=${classId}`, classDocument, { id: classDocument }, { parentId: classId, idSdm: sdm }),
        row("/referensi/sdm", "-", foreignSdm, { id_sdm: foreignSdm }, { integrationId: siblingId }),
        row("/penelitian", `id_sdm=${foreignSdm}`, foreignParent, { id: foreignParent }, { integrationId: siblingId, idSdm: foreignSdm }),
        row("/penelitian/{id}", `id=${foreignParent}`, "self", { id: foreignParent, dokumen: [{ id: foreignAttachment }] }, { integrationId: siblingId, parentId: foreignParent, idSdm: foreignSdm }),
        row("/pengajaran", `id_sdm=${foreignSdm}`, foreignParent, { id: foreignParent }, { integrationId: siblingId, idSdm: foreignSdm }),
        row("/pengajaran/{id}", `id=${foreignParent}`, "self", { id: foreignParent, id_kelas: foreignClass, id_pt: ownPt }, { integrationId: siblingId, parentId: foreignParent, idSdm: foreignSdm }),
        row("/kelas_kuliah/{id}/dokumen", `id=${foreignClass}`, foreignClassDocument, { id: foreignClassDocument }, { integrationId: siblingId, parentId: foreignClass, idSdm: foreignSdm }),
      ] });
      assert.equal(await hasSisterFileAccess("dokumen", sharedDocument, tx), true, "A retired owner must not hide another active metadata owner");
      assert.equal(await hasSisterFileAccess("dokumen", foreignMetadata, tx), false, "Foreign metadata cannot grant access");
      assert.equal(await hasSisterFileAccess("dokumen", missingOwnerDocument, tx), false, "Metadata without an owner cannot grant access");
      assert.equal(await hasSisterFileAccess("dokumen", wrongScopeDocument, tx), false, "An inconsistent metadata owner scope cannot grant access");
      assert.equal(await hasSisterFileAccess("dokumen", foreignIndexDocument, tx), false, "A sibling SDM index cannot validate current-integration metadata");
      await tx.sisterReplicaRecord.update({ where: key("/dokumen", `id_sdm=${sdm}`, sharedDocument), data: { deletedAt: new Date() } });
      assert.equal(await hasSisterFileAccess("dokumen", sharedDocument, tx), false, "Retired metadata plus a retired alternative owner cannot grant access");
      await tx.sisterReplicaRecord.update({ where: key("/dokumen", `id_sdm=${sdm}`, sharedDocument), data: { deletedAt: null } });
      assert.equal(await hasSisterFileAccess("dokumen", foreignAttachment, tx), false, "Foreign integration cannot grant activity attachment access");
      assert.equal(await hasSisterFileAccess("dokumen", foreignClassDocument, tx), false, "Foreign integration cannot grant class access even with the same PT");
      assert.equal(await hasSisterFileAccess("dokumen", attachment, tx), true, "Owned explicit attachment is permitted");
      await tx.sisterReplicaRecord.update({ where: key("/penelitian/{id}", `id=${activity}`, "self"), data: { scopeKey: `id=${foreignParent}` } });
      assert.equal(await hasSisterFileAccess("dokumen", attachment, tx), false, "An inconsistent cached detail scope cannot grant access");
      await tx.sisterReplicaRecord.update({ where: key("/penelitian/{id}", `id=${foreignParent}`, "self"), data: { scopeKey: `id=${activity}` } });
      assert.equal(await hasSisterFileAccess("dokumen", classDocument, tx), false, "Foreign PT class must be denied even with inline teaching attachments");
      await tx.sisterReplicaRecord.update({ where: key("/pengajaran/{id}", `id=${teaching}`, "self"), data: {
        payloadJson: { id: teaching, id_kelas: classId, id_pt: ownPt },
      } });
      assert.equal(await hasSisterFileAccess("dokumen", classDocument, tx), true, "Own PT class with a known teaching parent is permitted");
      await tx.sisterReplicaRecord.create({ data: row("/referensi/profil_pt", "-", foreignPt, { id: foreignPt }) });
      assert.equal(await hasSisterFileAccess("dokumen", classDocument, tx), false, "An ambiguous own-PT cache cannot authorize class files");
      await tx.sisterReplicaRecord.delete({ where: key("/referensi/profil_pt", "-", foreignPt) });
      await tx.sisterReplicaRecord.update({ where: key("/pengajaran", `id_sdm=${sdm}`, teaching), data: { deletedAt: new Date() } });
      assert.equal(await hasSisterFileAccess("dokumen", classDocument, tx), false, "Retired teaching parent cannot grant access");
      await tx.sisterReplicaRecord.update({ where: key("/penelitian/{id}", `id=${activity}`, "self"), data: {
        payloadJson: { id: activity, other_field: { id: attachment } },
      } });
      assert.equal(await hasSisterFileAccess("dokumen", attachment, tx), false, "An arbitrary nested ID is not document membership");
      await tx.sisterReplicaRecord.update({ where: key("/penelitian/{id}", `id=${activity}`, "self"), data: {
        payloadJson: { id: activity, dokumen: [{ id_dokumen: attachment }] },
      } });
      assert.equal(await hasSisterFileAccess("dokumen", attachment, tx), true, "Document ID alias is supported on explicit attachments");
      await tx.sisterReplicaRecord.update({ where: key("/referensi/sdm", "-", sdm), data: { deletedAt: new Date() } });
      assert.equal(await hasSisterFileAccess("dokumen", attachment, tx), false, "Retired SDM cannot grant attachment access");
      assert.equal(await hasSisterFileAccess("dokumen", sharedDocument, tx), false, "All retired metadata owners must deny access");
      throw new QaRollback("Document ownership QA rollback");
    }, { timeout: 20000 });
  } catch (error) { if (!(error instanceof QaRollback)) throw error; }
  assert.equal(await prisma.sisterReplicaRecord.count({ where: { integrationId: { in: [integrationId, siblingId] }, OR: [{ itemKey: { in: allIds } }, { parentId: { in: allIds } }] } }), 0, "QA records must roll back completely");
}
