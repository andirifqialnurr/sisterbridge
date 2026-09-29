// Read-only replica catalog, derived from the GET endpoints in
// `SISTER Web Service PT.pdf` (API 1.0.0) and the module breakdown in
// `cookbook/sister_0*.md`. Only JSON GET endpoints are listed; POST, PUT and
// DELETE are never called by the replica.
//
// Deliberately excluded:
// - `/data_pribadi/foto/{id_sdm}` and `/dokumen/{id}/download` return binary
//   files, not JSON.
// - `/referensi/mahasiswa_pddikti` is a keyword search that requires a
//   program studi and keyword; it cannot be enumerated.
// - `/kolaborator_eksternal` is a search by `nama`/`nik`; without a keyword
//   SISTER answers 400, so it cannot be enumerated either.

export type ReplicaChild = {
  // Endpoint template with an `{id}` placeholder filled from the parent item.
  path: string;
  // A list endpoint addressed by an ID found in this child's payload, e.g.
  // `/kelas_kuliah/{id}/dokumen` from `id_kelas` of `/pengajaran/{id}`.
  // With `ownPtField`, only payloads whose field equals the PT's own
  // `id_perguruan_tinggi` are followed: SISTER answers 403 "Akses ditolak"
  // for classes a lecturer taught at another PT.
  follow?: { field: string; path: string; ownPtField?: string };
};

export type ReplicaListEndpoint = {
  path: string;
  query?: Record<string, string>;
  paginated?: boolean;
  children?: ReplicaChild[];
};

// Reference endpoints that need no parameters.
export const referensiSimpleEndpoints: ReplicaListEndpoint[] = [
  "kategori_capaian_luaran",
  "perguruan_tinggi",
  "agama",
  "bidang_studi",
  "bidang_usaha",
  "dudi",
  "gelar_akademik",
  "golongan_pangkat",
  "ikatan_kerja",
  "jenis_dokumen",
  "jabatan_fungsional",
  "jabatan_negara",
  "jabatan_tugas_tambahan",
  "jenis_bahan_ajar",
  "jenis_penghargaan",
  "jenis_kepanitiaan",
  "jenis_kesejahteraan",
  "jenis_beasiswa",
  "jenis_diklat",
  "jenis_keluar",
  "jenis_pekerjaan",
  "jenis_publikasi",
  "jenis_tes",
  "jenis_tunjangan",
  "jenjang_pendidikan",
  "profil_pt",
  "status_kepegawaian",
  "skim_kegiatan",
  "tingkat_penghargaan",
  "media_publikasi",
  "negara",
  "lembaga_sertifikasi",
  "semester",
  "sumber_gaji",
].map((name) => ({ path: `/referensi/${name}` }));

// Reference endpoints with a required enum parameter: every allowed value is
// fetched as its own scope.
export const referensiEnumEndpoints: ReplicaListEndpoint[] = [
  ...["0", "1", "2", "3"].map((level) => ({
    path: "/referensi/wilayah",
    query: { id_level_wilayah: level },
  })),
  ...["true", "false"].map((iptek) => ({
    path: "/referensi/kelompok_bidang",
    query: { iptek },
  })),
  // `tipe` is required; `list` returns every category as flat rows.
  { path: "/referensi/kategori_kegiatan", query: { tipe: "list" } },
];

export const sdmListEndpoint = "/referensi/sdm";
export const unitKerjaEndpoint = "/referensi/unit_kerja";
export const detailUnitKerjaEndpoint = "/referensi/detail_unit_kerja";

// Object endpoints addressed by `id_sdm` in the path.
export const sdmPathEndpoints = [
  "/data_pribadi/profil/{id_sdm}",
  "/data_pribadi/kependudukan/{id_sdm}",
  "/data_pribadi/keluarga/{id_sdm}",
  "/data_pribadi/alamat/{id_sdm}",
  "/data_pribadi/kepegawaian/{id_sdm}",
  "/data_pribadi/lain/{id_sdm}",
  "/data_pribadi/bidang_ilmu/{id_sdm}",
];

function withDetail(
  path: string,
  options: { paginated?: boolean; bidangIlmu?: boolean; follow?: ReplicaChild["follow"] } = {},
) {
  const children: ReplicaChild[] = [{ path: `${path}/{id}`, follow: options.follow }];
  if (options.bidangIlmu) {
    children.push({ path: `${path}/{id}/bidang_ilmu` });
  }

  return { path, paginated: options.paginated, children } satisfies ReplicaListEndpoint;
}

// List endpoints filtered by `?id_sdm=`; each item's detail (and nested
// bidang_ilmu where documented) is replicated as a child.
export const sdmListEndpoints: ReplicaListEndpoint[] = [
  withDetail("/anggota_profesi"),
  withDetail("/bahan_ajar"),
  withDetail("/beasiswa"),
  withDetail("/bimbing_dosen"),
  withDetail("/bimbingan_mahasiswa", { bidangIlmu: true }),
  withDetail("/detasering"),
  withDetail("/diklat"),
  withDetail("/dokumen"),
  withDetail("/inpassing"),
  withDetail("/jabatan_fungsional"),
  withDetail("/jabatan_fungsional/ajuan"),
  withDetail("/jabatan_struktural"),
  withDetail("/kekayaan_intelektual", { paginated: true, bidangIlmu: true }),
  withDetail("/kepangkatan"),
  withDetail("/kesejahteraan"),
  withDetail("/orasi_ilmiah"),
  withDetail("/pembicara"),
  withDetail("/pendidikan_formal"),
  withDetail("/pendidikan_formal/ajuan"),
  withDetail("/penelitian", { paginated: true, bidangIlmu: true }),
  withDetail("/pengabdian", { paginated: true, bidangIlmu: true }),
  withDetail("/pengajaran", {
    bidangIlmu: true,
    follow: { field: "id_kelas", path: "/kelas_kuliah/{id}/dokumen", ownPtField: "id_pt" },
  }),
  withDetail("/pengelola_jurnal"),
  withDetail("/penghargaan"),
  withDetail("/pengujian_mahasiswa", { bidangIlmu: true }),
  withDetail("/penugasan"),
  withDetail("/penunjang_lain", { paginated: true }),
  withDetail("/publikasi", { paginated: true, bidangIlmu: true }),
  withDetail("/riwayat_pekerjaan"),
  withDetail("/sertifikasi_dosen"),
  withDetail("/sertifikasi_dosen/ajuan"),
  withDetail("/sertifikasi_profesi"),
  withDetail("/nilai_tes"),
  withDetail("/nilai_tes/ajuan"),
  withDetail("/tugas_tambahan"),
  withDetail("/tunjangan"),
  withDetail("/visiting_scientist"),
  { path: "/bkd/laporan_akhir_bkd" },
];

// BKD activity endpoints need `id_smt`; the replica takes the semesters from
// the SDM's own `laporan_akhir_bkd` rows because `/referensi/semester`
// currently answers 500 on both sandbox and production.
export const bkdActivityEndpoints = [
  "/bkd/pendidikan",
  "/bkd/ajar",
  "/bkd/tunjang",
  "/bkd/pengmas",
  "/bkd/penelitian",
];

export const replicaPageSize = 100;

// Every endpoint template the sync can write into sister_replica_record.
export function replicaEndpointTemplates(): string[] {
  const templates = new Set<string>();
  for (const endpoint of [...referensiSimpleEndpoints, ...referensiEnumEndpoints]) {
    templates.add(endpoint.path);
  }
  templates.add(sdmListEndpoint);
  templates.add(unitKerjaEndpoint);
  templates.add(detailUnitKerjaEndpoint);
  sdmPathEndpoints.forEach((path) => templates.add(path));
  for (const endpoint of sdmListEndpoints) {
    templates.add(endpoint.path);
    for (const child of endpoint.children ?? []) {
      templates.add(child.path);
      if (child.follow) {
        templates.add(child.follow.path);
      }
    }
  }
  bkdActivityEndpoints.forEach((path) => templates.add(path));
  return [...templates].sort();
}
