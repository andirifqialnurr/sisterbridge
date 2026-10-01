import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

export type SdmReportGroup = { jenis_sdm: string; status_aktif: string; total: number };
export type SdmReportRow = { id_sdm: string; nama_sdm: string | null; nidn: string | null; nip: string | null; jenis_sdm: string; status_aktif: string };
export type OutputReportGroup = { module: string; tahun: number; total: number; participations: number };
export type OutputReportRow = { id: string; id_sdm: string | null; tahun: number };
export type BkdReportGroup = { id_smt: string; simpulan: string; total: number };
export type BkdReportRow = { id_sdm: string; nama_sdm: string | null; nidn: string | null; id_smt: string; simpulan: string | null };
export type ScopeReportGroup = { endpoint: string; total: number; failed: number; not_found: number; last_fetched_at: Date | null };
export type ScopeIssue = { endpoint: string; scope_key: string; id_sdm: string | null; status: number; code: string | null; last_fetched_at: Date; last_success_at: Date | null };
export type WarningSyncRun = { id: string; scope: string; status: string; requestCount: number; errorCount: number; startedAt: Date; finishedAt: Date | null };

type Client = Pick<PrismaClient, "$queryRawUnsafe" | "sisterSyncRun">;
const outputSource = {
  publikasi: { view: "publikasi_list", year: "extract(year FROM tanggal)::int" },
  penelitian: { view: "penelitian_list", year: "tahun_pelaksanaan::int" },
  pengabdian: { view: "pengabdian_list", year: "tahun_pelaksanaan::int" },
} as const;

export class PrismaBusinessReportingRepository {
  constructor(private readonly client: Client = prisma) {}

  async sdmGroups(integrationId: string) {
    return this.client.$queryRawUnsafe<SdmReportGroup[]>(
      `SELECT COALESCE(NULLIF(btrim(jenis_sdm), ''), 'Tidak diketahui') AS jenis_sdm,
              COALESCE(NULLIF(btrim(nama_status_aktif), ''), 'Tidak diketahui') AS status_aktif,
              count(*)::int AS total
         FROM replica.referensi_sdm
        WHERE r_integration_id = $1
        GROUP BY 1, 2 ORDER BY 1, 2`,
      integrationId,
    );
  }

  async sdmRows(integrationId: string, kind: string | null, status: string | null, limit: number, offset: number) {
    return this.client.$queryRawUnsafe<SdmReportRow[]>(
      `SELECT id_sdm, nama_sdm, nidn, nip,
              COALESCE(NULLIF(btrim(jenis_sdm), ''), 'Tidak diketahui') AS jenis_sdm,
              COALESCE(NULLIF(btrim(nama_status_aktif), ''), 'Tidak diketahui') AS status_aktif
         FROM replica.referensi_sdm
        WHERE r_integration_id = $1
          AND ($2::text IS NULL OR COALESCE(NULLIF(btrim(jenis_sdm), ''), 'Tidak diketahui') = $2)
          AND ($3::text IS NULL OR COALESCE(NULLIF(btrim(nama_status_aktif), ''), 'Tidak diketahui') = $3)
        ORDER BY nama_sdm, id_sdm LIMIT $4 OFFSET $5`,
      integrationId,
      kind,
      status,
      limit,
      offset,
    );
  }

  async countSdmRows(integrationId: string, kind: string | null, status: string | null) {
    const rows = await this.client.$queryRawUnsafe<{ total: number }[]>(
      `SELECT count(*)::int AS total FROM replica.referensi_sdm
        WHERE r_integration_id = $1
          AND ($2::text IS NULL OR COALESCE(NULLIF(btrim(jenis_sdm), ''), 'Tidak diketahui') = $2)
          AND ($3::text IS NULL OR COALESCE(NULLIF(btrim(nama_status_aktif), ''), 'Tidak diketahui') = $3)`,
      integrationId,
      kind,
      status,
    );
    return rows[0]?.total ?? 0;
  }

  async outputGroups(integrationId: string) {
    return this.client.$queryRawUnsafe<OutputReportGroup[]>(
      `SELECT 'publikasi' AS module, extract(year FROM tanggal)::int AS tahun, count(DISTINCT id)::int AS total, count(id)::int AS participations
         FROM replica.publikasi_list WHERE r_integration_id = $1 AND tanggal IS NOT NULL GROUP BY 1, 2
       UNION ALL
       SELECT 'penelitian', tahun_pelaksanaan::int, count(DISTINCT id)::int, count(id)::int
         FROM replica.penelitian_list WHERE r_integration_id = $1 AND tahun_pelaksanaan IS NOT NULL GROUP BY 1, 2
       UNION ALL
       SELECT 'pengabdian', tahun_pelaksanaan::int, count(DISTINCT id)::int, count(id)::int
         FROM replica.pengabdian_list WHERE r_integration_id = $1 AND tahun_pelaksanaan IS NOT NULL GROUP BY 1, 2
       ORDER BY tahun, module`,
      integrationId,
    );
  }

  async outputRows(integrationId: string, module: keyof typeof outputSource, year: number, limit: number, offset: number) {
    const source = outputSource[module];
    return this.client.$queryRawUnsafe<OutputReportRow[]>(
      `SELECT id, r_id_sdm AS id_sdm, tahun FROM (
         SELECT DISTINCT ON (id) id, r_id_sdm AS id_sdm, ${source.year} AS tahun
           FROM replica.${source.view}
          WHERE r_integration_id = $1 AND ${source.year} = $2
          ORDER BY id, r_id_sdm
       ) unique_activities
       ORDER BY id LIMIT $3 OFFSET $4`,
      integrationId,
      year,
      limit,
      offset,
    );
  }

  async countOutputRows(integrationId: string, module: keyof typeof outputSource, year: number) {
    const source = outputSource[module];
    const rows = await this.client.$queryRawUnsafe<{ total: number }[]>(
      `SELECT count(DISTINCT id)::int AS total FROM replica.${source.view}
        WHERE r_integration_id = $1 AND ${source.year} = $2`,
      integrationId,
      year,
    );
    return rows[0]?.total ?? 0;
  }

  async bkdGroups(integrationId: string) {
    return this.client.$queryRawUnsafe<BkdReportGroup[]>(
      `SELECT id_smt, COALESCE(NULLIF(btrim(simpulan_asesor), ''), 'Tidak tersedia') AS simpulan,
              count(DISTINCT r_id_sdm)::int AS total
         FROM replica.bkd_laporan_akhir_bkd
        WHERE r_integration_id = $1 AND id_smt IS NOT NULL
        GROUP BY id_smt, 2 ORDER BY id_smt DESC, 2`,
      integrationId,
    );
  }

  async bkdRows(integrationId: string, semester: string, simpulan: string | null, limit: number, offset: number) {
    return this.client.$queryRawUnsafe<BkdReportRow[]>(
      `SELECT b.r_id_sdm AS id_sdm, s.nama_sdm, s.nidn, b.id_smt,
              COALESCE(NULLIF(btrim(b.simpulan_asesor), ''), 'Tidak tersedia') AS simpulan
         FROM replica.bkd_laporan_akhir_bkd b
         LEFT JOIN replica.referensi_sdm s
           ON s.r_integration_id = b.r_integration_id AND s.id_sdm = b.r_id_sdm
        WHERE b.r_integration_id = $1 AND b.id_smt = $2
          AND ($3::text IS NULL OR COALESCE(NULLIF(btrim(b.simpulan_asesor), ''), 'Tidak tersedia') = $3)
        ORDER BY s.nama_sdm NULLS LAST, b.r_id_sdm
        LIMIT $4 OFFSET $5`,
      integrationId,
      semester,
      simpulan,
      limit,
      offset,
    );
  }

  async countBkdRows(integrationId: string, semester: string, simpulan: string | null) {
    const rows = await this.client.$queryRawUnsafe<{ total: number }[]>(
      `SELECT count(DISTINCT r_id_sdm)::int AS total FROM replica.bkd_laporan_akhir_bkd
        WHERE r_integration_id = $1 AND id_smt = $2
          AND ($3::text IS NULL OR COALESCE(NULLIF(btrim(simpulan_asesor), ''), 'Tidak tersedia') = $3)`,
      integrationId,
      semester,
      simpulan,
    );
    return rows[0]?.total ?? 0;
  }

  async scopeGroups(integrationId: string) {
    return this.client.$queryRawUnsafe<ScopeReportGroup[]>(
      `SELECT endpoint, count(*)::int AS total,
              count(*) FILTER (WHERE last_status <> 200)::int AS failed,
              count(*) FILTER (WHERE last_status = 404)::int AS not_found,
              min(last_fetched_at) AS last_fetched_at
         FROM public.sister_replica_scope
        WHERE integration_id = $1
        GROUP BY endpoint ORDER BY endpoint`,
      integrationId,
    );
  }

  async scopeIssues(integrationId: string) {
    return this.client.$queryRawUnsafe<ScopeIssue[]>(
      `SELECT endpoint, scope_key, id_sdm, last_status AS status, last_error_code AS code,
              last_fetched_at, last_success_at
         FROM public.sister_replica_scope
        WHERE integration_id = $1 AND last_status <> 200
        ORDER BY last_fetched_at DESC LIMIT 201`,
      integrationId,
    );
  }

  latestSyncRuns(integrationId: string) {
    return this.client.sisterSyncRun.findMany({
      where: { integrationId },
      orderBy: { startedAt: "desc" },
      take: 20,
      select: { id: true, scope: true, status: true, requestCount: true, errorCount: true, startedAt: true, finishedAt: true },
    });
  }
}