// Live, read-only explorer over every JSON GET endpoint of SISTER Web
// Service PT (see cookbook/sister_0*.md). The browser only ever sends a
// module key from this catalog plus validated IDs; paths are resolved here,
// so there is no generic proxy. Binary endpoints (foto, dokumen download)
// are served by /api/sister/file/*; keyword searches (mahasiswa_pddikti,
// kolaborator_eksternal) are "search" modules that take allowlisted inputs.

export type JelajahGroup =
  | "Data pribadi"
  | "Kepegawaian"
  | "Pendidikan dan kompetensi"
  | "Pengajaran dan bimbingan"
  | "Penelitian dan publikasi"
  | "Pengabdian dan penunjang"
  | "Kesejahteraan"
  | "Dokumen dan BKD"
  | "Pencarian"
  | "Referensi";

export type JelajahChild = {
  key: "bidang_ilmu" | "kelas_dokumen" | "detail_unit_kerja";
  label: string;
  path: string;
  // Where the child's ID comes from: the item's `id` (default) or another
  // field of the item/detail (e.g. `id_kelas`).
  sourceField?: string;
  // The ID goes into this query parameter instead of the `{id}` path slot.
  queryParam?: string;
};

export type JelajahSearchField = {
  name: "nama" | "nik" | "keyword" | "id_program_studi";
  label: string;
  // "prodi" is chosen from the PT's own program studi (unit_kerja jenis 3).
  input: "text" | "prodi";
  required?: boolean;
};

export type JelajahModule = {
  key: string;
  label: string;
  group: JelajahGroup;
  // sdm_list: list filtered by ?id_sdm=; sdm_object: object at /{id_sdm};
  // referensi: list without SDM; search: list driven by keyword inputs.
  kind: "sdm_list" | "sdm_object" | "referensi" | "search";
  searchFields?: JelajahSearchField[];
  // At least one of these search fields must be filled.
  searchAnyOf?: JelajahSearchField["name"][];
  path: string;
  detailPath?: string;
  paginated?: boolean;
  children?: JelajahChild[];
  // Fixed query for referensi variants (e.g. wilayah level).
  query?: Record<string, string>;
  // Query filled server-side with the PT's own id_perguruan_tinggi.
  ownPtQuery?: string;
  note?: string;
};

const bidangIlmu = (path: string): JelajahChild => ({
  key: "bidang_ilmu",
  label: "Bidang ilmu",
  path: `${path}/{id}/bidang_ilmu`,
});

function sdmList(
  key: string,
  label: string,
  group: JelajahGroup,
  path: string,
  options: { paginated?: boolean; bidangIlmu?: boolean; children?: JelajahChild[]; note?: string } = {},
): JelajahModule {
  return {
    key,
    label,
    group,
    kind: "sdm_list",
    path,
    detailPath: `${path}/{id}`,
    paginated: options.paginated,
    children: [...(options.bidangIlmu ? [bidangIlmu(path)] : []), ...(options.children ?? [])],
    note: options.note,
  };
}

function sdmObject(key: string, label: string, path: string): JelajahModule {
  return { key, label, group: "Data pribadi", kind: "sdm_object", path };
}

function referensi(
  key: string,
  label: string,
  path: string,
  options: Pick<JelajahModule, "query" | "ownPtQuery" | "children" | "note"> = {},
): JelajahModule {
  return { key, label, group: "Referensi", kind: "referensi", path, ...options };
}

const referensiSimple: [string, string][] = [
  ["agama", "Agama"],
  ["bidang_studi", "Bidang studi"],
  ["bidang_usaha", "Bidang usaha"],
  ["dudi", "DUDI"],
  ["gelar_akademik", "Gelar akademik"],
  ["golongan_pangkat", "Golongan pangkat"],
  ["ikatan_kerja", "Ikatan kerja"],
  ["jabatan_fungsional", "Jabatan fungsional"],
  ["jabatan_negara", "Jabatan negara"],
  ["jabatan_tugas_tambahan", "Jabatan tugas tambahan"],
  ["jenis_bahan_ajar", "Jenis bahan ajar"],
  ["jenis_beasiswa", "Jenis beasiswa"],
  ["jenis_diklat", "Jenis diklat"],
  ["jenis_dokumen", "Jenis dokumen"],
  ["jenis_keluar", "Jenis keluar"],
  ["jenis_kepanitiaan", "Jenis kepanitiaan"],
  ["jenis_kesejahteraan", "Jenis kesejahteraan"],
  ["jenis_pekerjaan", "Jenis pekerjaan"],
  ["jenis_penghargaan", "Jenis penghargaan"],
  ["jenis_publikasi", "Jenis publikasi"],
  ["jenis_tes", "Jenis tes"],
  ["jenis_tunjangan", "Jenis tunjangan"],
  ["jenjang_pendidikan", "Jenjang pendidikan"],
  ["kategori_capaian_luaran", "Kategori capaian luaran"],
  ["lembaga_sertifikasi", "Lembaga sertifikasi"],
  ["media_publikasi", "Media publikasi"],
  ["negara", "Negara"],
  ["perguruan_tinggi", "Perguruan tinggi"],
  ["profil_pt", "Profil PT"],
  ["semester", "Semester"],
  ["skim_kegiatan", "Skim kegiatan"],
  ["status_kepegawaian", "Status kepegawaian"],
  ["sumber_gaji", "Sumber gaji"],
  ["tingkat_penghargaan", "Tingkat penghargaan"],
  ["sdm", "SDM"],
];

export const jelajahModules: JelajahModule[] = [
  sdmObject("profil", "Profil", "/data_pribadi/profil/{id_sdm}"),
  sdmObject("kependudukan", "Kependudukan", "/data_pribadi/kependudukan/{id_sdm}"),
  sdmObject("keluarga", "Keluarga", "/data_pribadi/keluarga/{id_sdm}"),
  sdmObject("alamat", "Alamat", "/data_pribadi/alamat/{id_sdm}"),
  sdmObject("kepegawaian", "Kepegawaian", "/data_pribadi/kepegawaian/{id_sdm}"),
  sdmObject("lain", "Data lain", "/data_pribadi/lain/{id_sdm}"),
  sdmObject("bidang_ilmu_sdm", "Bidang ilmu SDM", "/data_pribadi/bidang_ilmu/{id_sdm}"),

  sdmList("penugasan", "Penugasan", "Kepegawaian", "/penugasan"),
  sdmList("jabatan_fungsional", "Jabatan fungsional", "Kepegawaian", "/jabatan_fungsional"),
  sdmList("jabatan_fungsional_ajuan", "Ajuan jabatan fungsional", "Kepegawaian", "/jabatan_fungsional/ajuan"),
  sdmList("jabatan_struktural", "Jabatan struktural", "Kepegawaian", "/jabatan_struktural"),
  sdmList("kepangkatan", "Kepangkatan", "Kepegawaian", "/kepangkatan"),
  sdmList("inpassing", "Inpassing", "Kepegawaian", "/inpassing"),
  sdmList("riwayat_pekerjaan", "Riwayat pekerjaan", "Kepegawaian", "/riwayat_pekerjaan"),
  sdmList("tugas_tambahan", "Tugas tambahan", "Kepegawaian", "/tugas_tambahan"),
  sdmList("detasering", "Detasering", "Kepegawaian", "/detasering"),

  sdmList("pendidikan_formal", "Pendidikan formal", "Pendidikan dan kompetensi", "/pendidikan_formal"),
  sdmList("pendidikan_formal_ajuan", "Ajuan pendidikan formal", "Pendidikan dan kompetensi", "/pendidikan_formal/ajuan", {
    note: "Sebagian detail menjawab 500 dari SISTER.",
  }),
  sdmList("diklat", "Diklat", "Pendidikan dan kompetensi", "/diklat"),
  sdmList("sertifikasi_dosen", "Sertifikasi dosen", "Pendidikan dan kompetensi", "/sertifikasi_dosen"),
  sdmList("sertifikasi_dosen_ajuan", "Ajuan sertifikasi dosen", "Pendidikan dan kompetensi", "/sertifikasi_dosen/ajuan"),
  sdmList("sertifikasi_profesi", "Sertifikasi profesi", "Pendidikan dan kompetensi", "/sertifikasi_profesi"),
  sdmList("nilai_tes", "Nilai tes", "Pendidikan dan kompetensi", "/nilai_tes", {
    note: "Detail /nilai_tes/{id} menjawab 404 di sandbox walau item ada di daftar.",
  }),
  sdmList("nilai_tes_ajuan", "Ajuan nilai tes", "Pendidikan dan kompetensi", "/nilai_tes/ajuan"),
  sdmList("beasiswa", "Beasiswa", "Pendidikan dan kompetensi", "/beasiswa"),

  sdmList("pengajaran", "Pengajaran", "Pengajaran dan bimbingan", "/pengajaran", {
    bidangIlmu: true,
    children: [
      {
        key: "kelas_dokumen",
        label: "Dokumen kelas kuliah",
        path: "/kelas_kuliah/{id}/dokumen",
        sourceField: "id_kelas",
      },
    ],
    note: "Dokumen kelas hanya dapat dibaca untuk kelas milik PT sendiri (lainnya 403).",
  }),
  sdmList("bimbingan_mahasiswa", "Bimbingan mahasiswa", "Pengajaran dan bimbingan", "/bimbingan_mahasiswa", {
    bidangIlmu: true,
  }),
  sdmList("pengujian_mahasiswa", "Pengujian mahasiswa", "Pengajaran dan bimbingan", "/pengujian_mahasiswa", {
    bidangIlmu: true,
  }),
  sdmList("bimbing_dosen", "Bimbingan dosen", "Pengajaran dan bimbingan", "/bimbing_dosen"),
  sdmList("bahan_ajar", "Bahan ajar", "Pengajaran dan bimbingan", "/bahan_ajar"),
  sdmList("orasi_ilmiah", "Orasi ilmiah", "Pengajaran dan bimbingan", "/orasi_ilmiah"),

  sdmList("penelitian", "Penelitian", "Penelitian dan publikasi", "/penelitian", {
    paginated: true,
    bidangIlmu: true,
  }),
  sdmList("publikasi", "Publikasi", "Penelitian dan publikasi", "/publikasi", {
    paginated: true,
    bidangIlmu: true,
  }),
  sdmList("kekayaan_intelektual", "Kekayaan intelektual", "Penelitian dan publikasi", "/kekayaan_intelektual", {
    paginated: true,
    bidangIlmu: true,
  }),
  sdmList("pengelola_jurnal", "Pengelola jurnal", "Penelitian dan publikasi", "/pengelola_jurnal"),
  sdmList("visiting_scientist", "Visiting scientist", "Penelitian dan publikasi", "/visiting_scientist"),

  sdmList("pengabdian", "Pengabdian", "Pengabdian dan penunjang", "/pengabdian", {
    paginated: true,
    bidangIlmu: true,
  }),
  sdmList("pembicara", "Pembicara", "Pengabdian dan penunjang", "/pembicara"),
  sdmList("penunjang_lain", "Penunjang lain", "Pengabdian dan penunjang", "/penunjang_lain", { paginated: true }),
  sdmList("anggota_profesi", "Anggota profesi", "Pengabdian dan penunjang", "/anggota_profesi"),
  sdmList("penghargaan", "Penghargaan", "Pengabdian dan penunjang", "/penghargaan"),

  sdmList("kesejahteraan", "Kesejahteraan", "Kesejahteraan", "/kesejahteraan"),
  sdmList("tunjangan", "Tunjangan", "Kesejahteraan", "/tunjangan"),

  sdmList("dokumen", "Dokumen (metadata)", "Dokumen dan BKD", "/dokumen", {
    note: "Hanya metadata; unduhan file tidak dibuka.",
  }),
  ...([
    ["bkd_pendidikan", "BKD pendidikan", "/bkd/pendidikan"],
    ["bkd_ajar", "BKD pengajaran", "/bkd/ajar"],
    ["bkd_tunjang", "BKD penunjang", "/bkd/tunjang"],
    ["bkd_pengmas", "BKD pengabdian", "/bkd/pengmas"],
    ["bkd_penelitian", "BKD penelitian", "/bkd/penelitian"],
  ] as const).map(([key, label, path]) => ({
    key,
    label,
    group: "Dokumen dan BKD" as const,
    kind: "sdm_list" as const,
    path,
    note: "Data dibaca dari replika per semester.",
  })),
  {
    key: "laporan_akhir_bkd",
    label: "Laporan akhir BKD",
    group: "Dokumen dan BKD",
    kind: "sdm_list",
    path: "/bkd/laporan_akhir_bkd",
  },

  ...referensiSimple.map(([name, label]) => referensi(`ref_${name}`, label, `/referensi/${name}`)),
  ...["0", "1", "2", "3"].map((level) =>
    referensi(
      `ref_wilayah_${level}`,
      `Wilayah level ${level} (${["negara", "provinsi", "kab/kota", "kecamatan"][Number(level)]})`,
      "/referensi/wilayah",
      { query: { id_level_wilayah: level } },
    ),
  ),
  referensi("ref_kelompok_bidang_iptek", "Kelompok bidang (iptek)", "/referensi/kelompok_bidang", {
    query: { iptek: "true" },
  }),
  referensi("ref_kelompok_bidang_non_iptek", "Kelompok bidang (non-iptek)", "/referensi/kelompok_bidang", {
    query: { iptek: "false" },
  }),
  referensi("ref_kategori_kegiatan", "Kategori kegiatan", "/referensi/kategori_kegiatan", {
    query: { tipe: "list" },
  }),
  {
    key: "kolaborator_eksternal",
    label: "Kolaborator eksternal",
    group: "Pencarian",
    kind: "search",
    path: "/kolaborator_eksternal",
    detailPath: "/kolaborator_eksternal/{id}",
    searchFields: [
      { name: "nama", label: "Nama", input: "text" },
      { name: "nik", label: "NIK", input: "text" },
    ],
    searchAnyOf: ["nama", "nik"],
    note: "Pencarian SISTER berdasarkan nama atau NIK; gateway kadang menjawab 503, coba ulang.",
  },
  {
    key: "mahasiswa_pddikti",
    label: "Mahasiswa PDDIKTI",
    group: "Pencarian",
    kind: "search",
    path: "/referensi/mahasiswa_pddikti",
    ownPtQuery: "id_perguruan_tinggi",
    searchFields: [
      { name: "id_program_studi", label: "Program studi", input: "prodi", required: true },
      { name: "keyword", label: "Nama / NIM", input: "text", required: true },
    ],
    note: "Pencarian mahasiswa per program studi PT sendiri; gateway kadang menjawab 503, coba ulang.",
  },
  referensi("ref_unit_kerja", "Unit kerja (PT sendiri)", "/referensi/unit_kerja", {
    ownPtQuery: "id_perguruan_tinggi",
    children: [
      {
        key: "detail_unit_kerja",
        label: "Detail unit kerja",
        path: "/referensi/detail_unit_kerja",
        queryParam: "id_unit_kerja",
      },
    ],
  }),
];

export const jelajahModuleKeys = jelajahModules.map((module) => module.key) as [string, ...string[]];

const modulesByKey = new Map(jelajahModules.map((module) => [module.key, module]));

export function getJelajahModule(key: string) {
  return modulesByKey.get(key) ?? null;
}
