import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

export type SdmCompositionRow = { jenis_sdm: string | null; status_aktif: string | null; total: number };
export type YearCountRow = { tahun: number; total: number };
export type BkdSemesterRow = { id_smt: string; simpulan: string | null; total: number };
export type LastSyncRow = { status: string; baseUrl: string; finishedAt: Date | null; startedAt: Date };

export type ReplikaDashboardRepository = {
  sdmComposition(integrationId: string): Promise<SdmCompositionRow[]>;
  syncedSdmCount(integrationId: string): Promise<number>;
  publikasiPerTahun(integrationId: string): Promise<YearCountRow[]>;
  penelitianPerTahun(integrationId: string): Promise<YearCountRow[]>;
  pengabdianPerTahun(integrationId: string): Promise<YearCountRow[]>;
  bkdPerSemester(integrationId: string): Promise<BkdSemesterRow[]>;
  lastSync(integrationId: string): Promise<LastSyncRow | null>;
};

type Client = Pick<PrismaClient, "$queryRawUnsafe" | "sisterSyncRun">;

// Joint activities are counted by distinct item id within the configured PT.
export class PrismaReplikaDashboardRepository implements ReplikaDashboardRepository {
  constructor(private readonly client: Client = prisma) {}

  private async count<T>(sql: string, ...params: unknown[]): Promise<T[]> {
    const rows = await this.client.$queryRawUnsafe<Record<string, unknown>[]>(sql, ...params);
    return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === "bigint" ? Number(value) : value]))) as T[];
  }

  sdmComposition(integrationId: string) {
    return this.count<SdmCompositionRow>(
      `SELECT btrim(jenis_sdm) AS jenis_sdm, btrim(nama_status_aktif) AS status_aktif, count(*) AS total
         FROM replica.referensi_sdm WHERE r_integration_id = $1 GROUP BY 1, 2`,
      integrationId,
    );
  }

  async syncedSdmCount(integrationId: string) {
    const rows = await this.count<{ total: number }>(
      `SELECT count(DISTINCT id_sdm) AS total FROM public.sister_replica_scope
        WHERE integration_id = $1 AND endpoint = '/data_pribadi/profil/{id_sdm}' AND last_success_at IS NOT NULL`,
      integrationId,
    );
    return rows[0]?.total ?? 0;
  }

  publikasiPerTahun(integrationId: string) {
    return this.count<YearCountRow>(
      `SELECT extract(year FROM tanggal)::int AS tahun, count(DISTINCT id) AS total
         FROM replica.publikasi_list WHERE r_integration_id = $1 AND tanggal IS NOT NULL GROUP BY 1`,
      integrationId,
    );
  }

  penelitianPerTahun(integrationId: string) {
    return this.count<YearCountRow>(
      `SELECT tahun_pelaksanaan::int AS tahun, count(DISTINCT id) AS total
         FROM replica.penelitian_list WHERE r_integration_id = $1 AND tahun_pelaksanaan IS NOT NULL GROUP BY 1`,
      integrationId,
    );
  }

  pengabdianPerTahun(integrationId: string) {
    return this.count<YearCountRow>(
      `SELECT tahun_pelaksanaan::int AS tahun, count(DISTINCT id) AS total
         FROM replica.pengabdian_list WHERE r_integration_id = $1 AND tahun_pelaksanaan IS NOT NULL GROUP BY 1`,
      integrationId,
    );
  }

  bkdPerSemester(integrationId: string) {
    return this.count<BkdSemesterRow>(
      `SELECT id_smt, simpulan_asesor AS simpulan, count(DISTINCT r_id_sdm) AS total
         FROM replica.bkd_laporan_akhir_bkd WHERE r_integration_id = $1 AND id_smt IS NOT NULL GROUP BY 1, 2`,
      integrationId,
    );
  }

  lastSync(integrationId: string) {
    return this.client.sisterSyncRun.findFirst({
      where: { integrationId, finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      select: { status: true, baseUrl: true, finishedAt: true, startedAt: true },
    });
  }
}
