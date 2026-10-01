import { getSisterConfig } from "@/server/sister/config";

import {
  PrismaReplikaDashboardRepository,
  type ReplikaDashboardRepository,
  type YearCountRow,
} from "../repository/replika_dashboard_repository";

const trendYears = 10;
const bkdSemesters = 8;

// Each section degrades on its own: a missing view (not generated yet) makes
// that section null instead of failing the whole dashboard.
async function section<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch {
    return null;
  }
}

function yearSeries(rows: YearCountRow[] | null, years: number[]) {
  if (!rows) return null;
  const byYear = new Map(rows.map((row) => [row.tahun, row.total]));
  return years.map((year) => byYear.get(year) ?? 0);
}

const semesterTerms: Record<string, string> = { "1": "Ganjil", "2": "Genap", "3": "Pendek" };

export function semesterLabel(idSmt: string) {
  const year = Number(idSmt.slice(0, 4));
  const term = semesterTerms[idSmt.slice(4)];
  return Number.isInteger(year) && term ? `${year}/${String(year + 1).slice(2)} ${term}` : idSmt;
}

export async function getReplikaDashboard(
  repository: ReplikaDashboardRepository = new PrismaReplikaDashboardRepository(),
  now = new Date(),
) {
  const integrationId = getSisterConfig().integration_id;
  const [composition, synced, publikasi, penelitian, pengabdian, bkd, lastSync] = integrationId
    ? await Promise.all([
        section(() => repository.sdmComposition(integrationId)),
        section(() => repository.syncedSdmCount(integrationId)),
        section(() => repository.publikasiPerTahun(integrationId)),
        section(() => repository.penelitianPerTahun(integrationId)),
        section(() => repository.pengabdianPerTahun(integrationId)),
        section(() => repository.bkdPerSemester(integrationId)),
        section(() => repository.lastSync(integrationId)),
      ])
    : [null, null, null, null, null, null, null];
  const currentYear = now.getFullYear();
  const years = Array.from({ length: trendYears }, (_, index) => currentYear - trendYears + 1 + index);

  const totalSdm = composition?.reduce((sum, row) => sum + row.total, 0) ?? null;
  const statusTotals = new Map<string, number>();
  for (const row of composition ?? []) {
    const key = row.status_aktif ?? "Tidak diketahui";
    statusTotals.set(key, (statusTotals.get(key) ?? 0) + row.total);
  }

  const semesters = [...new Set((bkd ?? []).map((row) => row.id_smt))].sort().slice(-bkdSemesters);
  const bkdCount = (idSmt: string, simpulan: string) =>
    (bkd ?? []).filter((row) => row.id_smt === idSmt && row.simpulan === simpulan).reduce((sum, row) => sum + row.total, 0);

  return {
    sdm: composition
      ? {
          total: totalSdm ?? 0,
          dosen: composition.filter((row) => row.jenis_sdm === "Dosen").reduce((sum, row) => sum + row.total, 0),
          dosen_aktif: composition
            .filter((row) => row.jenis_sdm === "Dosen" && row.status_aktif === "Aktif")
            .reduce((sum, row) => sum + row.total, 0),
          tendik: composition
            .filter((row) => row.jenis_sdm !== "Dosen")
            .reduce((sum, row) => sum + row.total, 0),
          by_status: [...statusTotals.entries()]
            .map(([label, total]) => ({ label, total }))
            .sort((a, b) => b.total - a.total),
        }
      : null,
    coverage: synced === null ? null : { synced_sdm: synced, total_sdm: totalSdm },
    last_sync: lastSync
      ? {
          status: lastSync.status,
          target: lastSync.baseUrl.includes("sandbox") ? "sandbox" : "production",
          finished_at: lastSync.finishedAt?.toISOString() ?? null,
        }
      : null,
    luaran:
      publikasi || penelitian || pengabdian
        ? {
            years,
            series: [
              { key: "publikasi", label: "Publikasi", data: yearSeries(publikasi, years) },
              { key: "penelitian", label: "Penelitian", data: yearSeries(penelitian, years) },
              { key: "pengabdian", label: "Pengabdian", data: yearSeries(pengabdian, years) },
            ].filter((series): series is { key: string; label: string; data: number[] } => series.data !== null),
          }
        : null,
    bkd: bkd
      ? {
          semesters: semesters.map((idSmt) => ({
            id_smt: idSmt,
            label: semesterLabel(idSmt),
            memenuhi: bkdCount(idSmt, "M"),
            tidak_memenuhi: bkdCount(idSmt, "T"),
          })),
        }
      : null,
  };
}

export type ReplikaDashboard = Awaited<ReturnType<typeof getReplikaDashboard>>;
