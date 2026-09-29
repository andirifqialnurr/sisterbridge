import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

export type SdmCompositionRow = { jenis_sdm: string | null; status_aktif: string | null; total: number };
export type YearCountRow = { tahun: number; total: number };
export type BkdSemesterRow = { id_smt: string; simpulan: string | null; total: number };
export type LastSyncRow = { status: string; baseUrl: string; finishedAt: Date | null; startedAt: Date };

export type ReplikaDashboardRepository = {
  sdmComposition(): Promise<SdmCompositionRow[]>;
  syncedSdmCount(): Promise<number>;
  publikasiPerTahun(): Promise<YearCountRow[]>;
  penelitianPerTahun(): Promise<YearCountRow[]>;
  pengabdianPerTahun(): Promise<YearCountRow[]>;
  bkdPerSemester(): Promise<BkdSemesterRow[]>;
  lastSync(): Promise<LastSyncRow | null>;
};

type Client = Pick<PrismaClient, "$queryRawUnsafe" | "sisterSyncRun">;

// Items shared by several lecturers (a joint penelitian) appear in every
// member's list, so outputs are counted by distinct item id.
export class PrismaReplikaDashboardRepository implements ReplikaDashboardRepository {
  constructor(private readonly client: Client = prisma) {}

  private async count<T>(sql: string): Promise<T[]> {
    const rows = await this.client.$queryRawUnsafe<Record<string, unknown>[]>(sql);
    return rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, typeof value === "bigint" ? Number(value) : value]),
      ),
    ) as T[];
  }

  sdmComposition() {
    return this.count<SdmCompositionRow>(
      `SELECT btrim(jenis_sdm) AS jenis_sdm, btrim(nama_status_aktif) AS status_aktif, count(*) AS total
         FROM replica.referensi_sdm GROUP BY 1, 2`,
    );
  }

  async syncedSdmCount() {
    const rows = await this.count<{ total: number }>(
      `SELECT count(DISTINCT id_sdm) AS total FROM public.sister_replica_scope
        WHERE endpoint = '/data_pribadi/profil/{id_sdm}' AND last_success_at IS NOT NULL`,
    );
    return rows[0]?.total ?? 0;
  }

  publikasiPerTahun() {
    return this.count<YearCountRow>(
      `SELECT extract(year FROM tanggal)::int AS tahun, count(DISTINCT id) AS total
         FROM replica.publikasi_list WHERE tanggal IS NOT NULL GROUP BY 1`,
    );
  }

  penelitianPerTahun() {
    return this.count<YearCountRow>(
      `SELECT tahun_pelaksanaan::int AS tahun, count(DISTINCT id) AS total
         FROM replica.penelitian_list WHERE tahun_pelaksanaan IS NOT NULL GROUP BY 1`,
    );
  }

  pengabdianPerTahun() {
    return this.count<YearCountRow>(
      `SELECT tahun_pelaksanaan::int AS tahun, count(DISTINCT id) AS total
         FROM replica.pengabdian_list WHERE tahun_pelaksanaan IS NOT NULL GROUP BY 1`,
    );
  }

  bkdPerSemester() {
    return this.count<BkdSemesterRow>(
      `SELECT id_smt, simpulan_asesor AS simpulan, count(DISTINCT r_id_sdm) AS total
         FROM replica.bkd_laporan_akhir_bkd WHERE id_smt IS NOT NULL GROUP BY 1, 2`,
    );
  }

  lastSync() {
    return this.client.sisterSyncRun.findFirst({
      where: { finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      select: { status: true, baseUrl: true, finishedAt: true, startedAt: true },
    });
  }
}
