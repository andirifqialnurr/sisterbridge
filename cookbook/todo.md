# Portable TODO dan Project Backlog

Status: portable base + project profile; scope aktif UI managerial read-only.

Backlog ini memiliki dua lapisan: checklist portable yang dapat dipakai ulang
dan backlog detail untuk repository `sister-integrated`. Backlog detail adalah
turunan dari [schema.md](./schema.md), [architecture.md](./architecture.md),
[prd.md](./prd.md), [security.md](./security.md), dan
[SISTER Web Service PT.pdf](../SISTER%20Web%20Service%20PT.pdf).

## Cara menggunakan pada repository lain

1. Baca repository tujuan, package manager/runner, framework, database, auth, dan
   testing setup sebelum mencentang atau menambah item.
2. Pertahankan gate kontrak, module-first, shared component/widget, server-only
   secret boundary, dan database `snake_case`.
3. Ganti project profile dan semua item yang menyebut external system, endpoint,
   role, status, atau domain khusus.
4. Jangan menganggap item selesai hanya karena struktur file sudah dibuat;
   setiap item membutuhkan evidence yang sesuai dengan levelnya.

## Project Profile: `sister-integrated`

- External system: SISTER Web Service PT API Reference versi 1.0.0.
- Target inventory: 236 endpoint unik dalam 39 domain.
- Web: Next.js App Router, React, TypeScript, dan tRPC.
- Runner/runtime: Bun 1.3.x; workflow install dan script menggunakan
  `bun install` serta `bun run <script>`. `bun.lock` menjadi lockfile dan
  `bunfig.toml` memaksa executable script berjalan dengan Bun.
- Local data: PostgreSQL + Prisma; table/column physical name `snake_case`.
- Shared primitive: `src/component/ui/`.
- Shared composite: `src/component/widget/`.
- Theme: `src/const/theme.ts`, primary hijau, chart ApexCharts.
- Module awal read-only: `src/modules/pegawai/`, `src/modules/referensi/`,
  `src/modules/bkd/`, `src/modules/penugasan/`, dan
  `src/modules/pendidikan_formal/`, serta `src/modules/riwayat_pekerjaan/`.
- Security contract: `security.md`, dengan `security_audit_event` terpisah dari
  `sister_operation`.

## SISTER module catalog dan coverage

Indeks PDF memang berisi **39 modul**, bukan hanya modul yang sudah dipilih
untuk MVP. Breakdown lengkapnya dipisah agar setiap modul dapat dibaca tanpa
menelusuri 307 halaman PDF sekaligus:

| Bagian | Modul | File |
|---:|---|---|
| 01 | Akses, Anggota Profesi, BKD, Bahan Ajar, Beasiswa | [sister_01_akses_anggota_bkd_bahan_ajar_beasiswa.md](./sister_01_akses_anggota_bkd_bahan_ajar_beasiswa.md) |
| 02 | Bimbingan Dosen, Bimbingan Mahasiswa, Data Pokok, Detasering, Diklat | [sister_02_bimbingan_data_pokok_detasering_diklat.md](./sister_02_bimbingan_data_pokok_detasering_diklat.md) |
| 03 | Dokumen, Inpassing, Jabatan Fungsional, Jabatan Struktural, Kekayaan Intelektual | [sister_03_dokumen_inpassing_jabatan_kekayaan.md](./sister_03_dokumen_inpassing_jabatan_kekayaan.md) |
| 04 | Kelas Kuliah, Kepangkatan, Kesejahteraan, Kolaborator Eksternal | [sister_04_kelas_kuliah_kepangkatan_kesejahteraan_kolaborator.md](./sister_04_kelas_kuliah_kepangkatan_kesejahteraan_kolaborator.md) |
| 05 | Orasi Ilmiah, Pembicara, Pendidikan Formal, Penelitian | [sister_05_orasi_pembicara_pendidikan_penelitian.md](./sister_05_orasi_pembicara_pendidikan_penelitian.md) |
| 06 | Pengabdian, Pengajaran, Pengelola Jurnal, Penghargaan | [sister_06_pengabdian_pengajaran_jurnal_penghargaan.md](./sister_06_pengabdian_pengajaran_jurnal_penghargaan.md) |
| 07 | Pengujian Mahasiswa, Penugasan, Penunjang Lain, Publikasi | [sister_07_penguji_penugasan_penunjang_publikasi.md](./sister_07_penguji_penugasan_penunjang_publikasi.md) |
| 08 | Referensi, Riwayat Pekerjaan, Sertifikasi Dosen, Sertifikasi Profesi | [sister_08_referensi_riwayat_sertifikasi.md](./sister_08_referensi_riwayat_sertifikasi.md) |
| 09 | Tes, Tugas Tambahan, Tunjangan, Visiting Scientist | [sister_09_tes_tugas_tambahan_tunjangan_visiting_scientist.md](./sister_09_tes_tugas_tambahan_tunjangan_visiting_scientist.md) |

## Scope aktif dan cara membaca status (2026-09-30)

Produk adalah report dan warning read-only untuk admin PT. Scope aktif
seluruh 140 GET, termasuk halaman bisnis untuk setiap modul. CRUD, upload,
submit/approve ajuan dan workflow write tidak masuk backlog aktif.
`POST /authorize` tetap diperlukan server untuk autentikasi.

Acuan produk: [prd_managerial.md](./prd_managerial.md). Peta 39 modul dan
140 endpoint → route/widget/dependensi: [ui_endpoint_map.md](./ui_endpoint_map.md).
Kontrol UI: [security_ui.md](./security_ui.md). PRD/security lama belum dapat
ditulis pada sesi ini karena izin file; scope aktif mengikuti dokumen tersebut.
Daftar mutation di katalog hanya inventory kemampuan API.

Status dipisahkan: (1) read path terimplementasi, (2) GET live berhasil per
scope, (3) data tersimpan, (4) UI bisnis diterima. Explorer atau view database
tidak cukup untuk mencentang UI bisnis. Full sync lokal sebelumnya mencakup
97 SDM dengan pengecualian eksternal; bukan janji semua scope HTTP 200.

### Paket kerja UI yang dijalankan berurutan

Setiap paket adalah task utuh; commit per paket, bukan per subtask.
Baca kriteria penerimaan UI pada matriks sebelum mencentang. Semua task UI
di bawah masih terbuka; dokumentasi ini tidak mengubah runtime aplikasi.

- [x] DOC-UI Petakan 39 modul dan 140 GET, sumber target, route/widget,
  dependensi ID, kondisi awal dan pengecualian; selaraskan dokumen yang dapat ditulis.
- [ ] DOC-ACCESS Terapkan patch PRD/security lama setelah izin tulis file
  dipulihkan; hapus status kendala dan sinkronkan referensi dokumen pendamping.
- [ ] UI-FOUNDATION Rapikan navigasi berkelompok, route/tab/filter di URL;
  registry modul aktif dan permission yang ditegakkan juga pada server;
  hilangkan placeholder Pengajuan/Pengaturan atau hubungkan ke alur nyata;
  terapkan inset 30px dan hilangkan title/deskripsi berulang di halaman lama.
  Buat/reuse widget list, detail berlabel, relasi, metadata dokumen, dan status.
- [ ] UI-DATA Sediakan DTO terkurasi dan repository lokal per modul;
  selaraskan view dengan full sync jika diperlukan, pagination server-side
  dan total tanpa truncation. Pisahkan 404 upstream, empty sukses, belum sync,
  partial, stale dan 403 lintas PT; jangan mengklaim semua status 200 lokal
  berarti upstream 200. Lengkapi UI error scope di halaman bisnis.
- [ ] UI-SDM Selesaikan UI-08, 09, 12, 13, 14, 17, 29, 33, 37:
  data pokok dan kepegawaian, penugasan, ajuan jabatan, riwayat pekerjaan.
- [ ] UI-PENDIDIKAN Selesaikan UI-05, 10, 22, 34, 35, 36:
  pendidikan/kompetensi, termasuk master dan ajuan terpisah.
- [ ] UI-PENGAJARAN Selesaikan UI-03, 04, 06, 07, 16, 20, 25, 28:
  BKD enam GET, pengajaran/bimbingan/pengujian dan dokumen kelas dengan relasi sah.
- [ ] UI-PENELITIAN Selesaikan UI-15, 23, 26, 31, 39:
  penelitian/publikasi/KI, penulis/anggota/bidang ilmu/dokumen.
- [ ] UI-PENGABDIAN Selesaikan UI-02, 21, 24, 27, 30:
  pengabdian, pembicara, penunjang, penghargaan dan keanggotaan.
- [ ] UI-DOKUMEN Selesaikan UI-11, 18, 38:
  metadata/detail/unduh, kesejahteraan dan tunjangan, field sensitif dibatasi.
- [ ] UI-REFERENSI Selesaikan UI-19, 32:
  seluruh 41 GET referensi dan kolaborator; direktori, hierarki, selector,
  live search prodi/keyword atau nama/NIK; tampilkan state sumber unavailable.
- [ ] UI-OPERASI Selesaikan UI-01:
  login/status integrasi/sync dan klasifikasi error; tanpa menampilkan token.
- [ ] UI-REPORT Laporan SDM, BKD dan luaran; definisikan unit hitung dan
  deduplikasi lintas SDM; filter dan drill-down ke sumber; ApexCharts + tabel.
- [ ] UI-WARNING Pusat warning untuk kondisi sumber dan simpulan BKD
  yang eksplisit. Catat rule, alasan, freshness dan link bukti. Kebijakan stale
  serta rule bisnis tambahan harus ditetapkan sebelum diaktifkan.
- [ ] UI-QA Verifikasi alur seluruh GET-ID melalui browser, role/tenant,
  deep link/back, empty/error/stale, nested data, file dan search.
  Uji 1280/1024/390/320, light/dark, keyboard. Perbarui matriks dengan evidence
  nyata; tetap tandai keberhasilan live yang belum terverifikasi.

### Master acceptance UI 39 modul

Checkbox berikut berarti **UI target lengkap + evidence**, bukan keberadaan
adapter. Halaman khusus yang sudah ada tetap perlu migrasi/review/QA sesuai
matriks; Akses mencakup status integrasi, bukan endpoint GET tambahan.

- [ ] UI-01 Akses — Status koneksi, role integrasi, dan sinkronisasi; login lokal terpisah; verifikasi status integrasi tanpa credential, sumber, state, permission dan QA.
- [ ] UI-02 Anggota Profesi — Daftar keanggotaan; organisasi, periode, detail, dan bukti yang tersedia; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-03 BKD — Laporan akhir per semester; lima tab aktivitas, angka SKS dan simpulan dari SISTER; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-04 Bahan Ajar — Daftar bahan ajar; judul, jenis, tahun; detail penulis dan dokumen; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-05 Beasiswa — Riwayat beasiswa; jenis, penyelenggara, periode sesuai response; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-06 Bimbingan Dosen — Daftar/detail pembimbingan dosen dan pihak terkait; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-07 Bimbingan Mahasiswa — Daftar/detail bimbingan; mahasiswa, dosen, dan bidang ilmu; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-08 Data Pokok — Profil SDM dengan foto dan tujuh bagian data pokok; bagian sensitif dibatasi; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-09 Detasering — Riwayat penempatan detasering, instansi dan periode; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-10 Diklat — Daftar pelatihan, jenis, penyelenggara, periode dan dokumen; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-11 Dokumen — Daftar metadata, detail, preview yang didukung, dan unduh; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-12 Inpassing — Riwayat inpassing, informasi SK, tanggal dan bukti; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-13 Jabatan Fungsional — Riwayat jabatan dan tab ajuan terpisah dengan status dari SISTER; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-14 Jabatan Struktural — Riwayat jabatan, unit, periode dan informasi SK; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-15 Kekayaan Intelektual — Daftar karya, jenis, tahun; detail pihak terkait, dokumen dan bidang ilmu; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-16 Kelas Kuliah — Daftar dokumen kelas dibuka dari pengajaran; label kelas dan sumber PT; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-17 Kepangkatan — Riwayat pangkat/golongan, tanggal dan informasi SK; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-18 Kesejahteraan — Daftar/detail kesejahteraan per SDM dengan data sensitif dibatasi; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-19 Kolaborator Eksternal — Pencarian nama/NIK dan detail kolaborator; tidak ada daftar seluruh populasi; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-20 Orasi Ilmiah — Daftar/detail orasi, kegiatan, waktu dan dokumen; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-21 Pembicara — Daftar/detail kegiatan pembicara, peran, waktu dan bukti; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-22 Pendidikan Formal — Riwayat pendidikan, jenjang, institusi; dokumen dan ajuan terpisah; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-23 Penelitian — Daftar penelitian; judul, tahun, kategori; anggota, pendanaan bila tersedia, bidang ilmu dan dokumen; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-24 Pengabdian — Daftar pengabdian; judul, tahun, kategori; anggota, bidang ilmu dan dokumen; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-25 Pengajaran — Daftar pengajaran per semester, mata kuliah/kelas; detail, bidang ilmu dan dokumen kelas; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-26 Pengelola Jurnal — Daftar/detail jurnal, peran pengelola, periode dan bukti; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-27 Penghargaan — Daftar/detail penghargaan, jenis, tingkat, tahun dan dokumen; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-28 Pengujian Mahasiswa — Daftar/detail pengujian; mahasiswa, dosen dan bidang ilmu; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-29 Penugasan — Daftar/detail penempatan, PT/unit dan masa penugasan; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-30 Penunjang Lain — Daftar/detail kegiatan penunjang, peran, periode dan bukti; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-31 Publikasi — Daftar publikasi; judul, jenis, tahun; penulis, bidang ilmu dan dokumen; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-32 Referensi — Direktori referensi berlabel, profil PT dan hierarki unit/wilayah; pencarian mahasiswa terpisah; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-33 Riwayat Pekerjaan — Riwayat pekerjaan, institusi, jabatan, periode dan dokumen; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-34 Sertifikasi Dosen — Daftar/detail sertifikasi dan tab ajuan read-only; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-35 Sertifikasi Profesi — Daftar/detail sertifikasi, lembaga, bidang dan bukti; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-36 Tes — Daftar/detail hasil tes dan tab ajuan; detail 404 dibedakan dari list kosong; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-37 Tugas Tambahan — Daftar/detail tugas, jabatan, periode dan dokumen; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-38 Tunjangan — Daftar/detail tunjangan per SDM; nilai/nominal hanya jika tersedia dan diizinkan; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.
- [ ] UI-39 Visiting Scientist — Riwayat kegiatan, institusi tujuan, periode dan dokumen; list/detail/child sesuai GET-ID, sumber, state, permission dan QA.

### Pekerjaan yang tidak dijadikan klaim selesai

- [ ] Konfirmasi live endpoint yang masih 500 dan detail nilai tes yang pernah 404.
- [ ] Verifikasi pencarian mahasiswa production jika nanti masuk deployment production.
- [ ] Audit ownership file dan akses raw explorer/DTO sesuai security_ui.md.
- [ ] Dokumentasikan cakupan sukses/kosong/gagal tiap scope saat release UI;
  tidak menyebut 140/140 path sebagai 140/140 berhasil mengambil semua data.

## Arsip checkpoint implementasi

Bagian bertanggal di bawah adalah riwayat saat checkpoint tersebut dibuat.
Kalimat “credential belum tersedia” atau “belum dipersist” tidak menjadi
status terkini. Checklist portable/legacy setelah checkpoint dipakai sebagai
referensi; rencana write/upload/rekonsiliasi mutation tidak aktif untuk produk ini.

## Implementation checkpoint: 2026-09-17

Milestone pertama sudah mulai dikerjakan sebagai read-only vertical slice:

- [x] Foundation Next.js, tRPC, Prisma schema, Bun runner, dan theme hijau
      tersedia di repository.
- [x] Modul `pegawai` memiliki route `/pegawai` dan detail
      `/pegawai/{id_sdm}`.
- [x] Procedure `pegawai.search` dan `pegawai.get_detail` melewati protected
      tRPC boundary dan Zod input validation.
- [x] Detail pegawai membaca `GET /data_pribadi/profil/{id_sdm}` dan
      `GET /data_pribadi/kepegawaian/{id_sdm}` melalui adapter server-only.
- [x] Fixture sintetis tersedia untuk development; fixture ditolak di
      production.
- [x] Adapter live sudah dibatasi ke endpoint SDM yang disetujui PDF.
- [x] Test unit schema, adapter, service, dan production fixture guard lulus.
- [ ] Auth/session provider production, PostgreSQL migration, credential UAT,
      dan live contract test belum tersedia.

## Security hardening checkpoint: 2026-09-17

Checkpoint ini membuktikan source-level dan unit-test control pada transport
tRPC. Evidence ini belum menjadi bukti security production.

- [x] Request ID tervalidasi atau dibuat server-side, lalu diteruskan konsisten
      ke context tRPC dan response policy error.
- [x] Origin dan `Sec-Fetch-Site` cross-site ditolak dengan default-deny policy;
      allowlist dapat dikonfigurasi melalui `APP_ALLOWED_ORIGINS`.
- [x] Transport tRPC hanya menerima `GET` dan `POST`; POST harus JSON.
- [x] URL dan body request memiliki batas ukuran; body POST tetap diukur dari
      bytes aktual saat `Content-Length` tidak tersedia.
- [x] Rate limit fixed-window tersedia untuk single instance dan mengirim
      `Retry-After` serta header limit pada response 429.
- [x] Event policy denial dan authorization denial diarahkan ke model
      `security_audit_event` melalui service yang melakukan redaction.
- [x] Unit test policy, rate limiter, dan audit redaction lulus.
- [ ] Rate limit production multi-instance dengan Redis atau store terdistribusi
      belum dipilih.
- [ ] Audit persistence, retention, alert, dan append-only control belum diuji
      terhadap PostgreSQL migration/UAT.
- [ ] CSRF token khusus untuk mutation cookie belum diaktifkan karena release
      saat ini hanya memiliki capability read-only.

## Prisma migration checkpoint: 2026-09-17

Initial migration sudah dibuat dari `prisma/schema.prisma` dengan
`prisma migrate diff --from-empty`. Migration ini hanya merealisasikan metadata
lokal dan tidak mengubah database SISTER.

- [x] Migration lock PostgreSQL tersedia.
- [x] Initial migration membuat `app_user`, `sister_integration`, cache,
      `sister_operation`, dan `security_audit_event`.
- [x] Nama fisik table, column, enum, index, constraint, dan foreign key
      menggunakan lowercase `snake_case`.
- [x] Script `prisma:migrate:deploy` tersedia untuk deployment.
- [x] Script `prisma:migrate:status` tersedia untuk pemeriksaan migration.
- [x] Schema validation dan generated migration script berhasil diverifikasi
      tanpa koneksi ke database.
- [ ] Migration belum dijalankan terhadap PostgreSQL karena `DATABASE_URL`
      lokal/UAT belum tersedia.
- [ ] DB runtime role, backup, restore, retention, dan audit append-only belum
      diverifikasi pada environment deployment.
- [x] Repository Prisma `sister_sdm_index_cache` tersedia dengan composite key
      `integration_id` + `id_sdm` dan mapping kembali ke DTO SISTER.
- [x] Pegawai live read memiliki write-through summary cache dan detail dapat
      membaca cache yang masih fresh sebelum fallback ke SISTER.
- [x] Cache tidak aktif pada fixture mode atau tanpa `DATABASE_URL` dan
      kegagalannya tidak menjatuhkan read utama.
- [ ] Cache read/write belum diuji terhadap PostgreSQL nyata dan belum memiliki
      job retention/cleanup.

## Security audit readback checkpoint: 2026-09-17

- [x] Repository audit hanya memilih field DTO yang diperlukan dan memakai
      filter severity/outcome/event serta pagination terbatas.
- [x] Procedure `security.audit_list` hanya dapat dipanggil oleh role lokal
      `ADMIN` dan authorization denial dicatat sebagai security event.
- [x] Halaman `/audit` membedakan forbidden, database unavailable, empty, dan
      data state.
- [x] Metadata diaudit ulang melalui redaction sebelum dikirim ke UI; source IP
      hash dan user-agent hash tidak dikirim pada DTO readback.
- [x] Unit test repository, service, dan role boundary lulus.
- [ ] Audit readback belum diverifikasi dengan PostgreSQL migration dan user
      ADMIN nyata pada UAT.

## Operational diagnostics checkpoint: 2026-09-17

- [x] Procedure protected `overview.status` mengembalikan status aman untuk
      auth seam, database configuration, dan SISTER fixture/live configuration.
- [x] Status live yang belum lengkap tidak melempar detail credential atau URL
      ke browser.
- [x] Dashboard memakai widget status dengan state loading, error, fixture,
      incomplete, ready, dan refresh manual.
- [x] Unit test configuration status dan procedure overview lulus.
- [ ] Health check live `/authorize` belum dijalankan otomatis; perlu aksi
      eksplisit setelah credential UAT dan kebijakan maintenance dikonfirmasi.

## Referensi read-only checkpoint: 2026-09-17

Checkpoint ini hanya mencakup dua endpoint yang field dan metodenya sudah
terbaca jelas dari PDF. Tidak ada endpoint referensi lain yang ikut dibuka.

- [x] Schema runtime `/referensi/profil_pt` mengikuti 14 field pada PDF
      halaman 249 dan response array object.
- [x] Schema runtime `/referensi/semester` mengikuti `id` integer dan `nama`
      string pada PDF halaman 257-258.
- [x] Adapter live memakai path tetap tanpa query parameter arbitrary.
- [x] Fixture adapter, service safe DTO, dan protected tRPC procedure tersedia
      di `src/modules/referensi/`.
- [x] Halaman `/referensi` memiliki state loading, empty, error, source, dan
      refresh manual; tidak ada UI mutation.
- [x] Test adapter, schema, service, dan router lulus.
- [ ] Response live instance SISTER belum diuji karena credential dan UAT
      belum tersedia.

## BKD read-only checkpoint: 2026-09-17

Checkpoint ini hanya mencakup enam endpoint GET pada PDF halaman 19-26.
Tidak ada endpoint write, pagination, atau field tambahan yang dibuka.

- [x] Schema runtime laporan akhir mengikuti `/bkd/laporan_akhir_bkd` dengan
      query `id_sdm` dan 19 field response terdokumentasi.
- [x] Schema runtime lima aktivitas mengikuti `/bkd/pendidikan`, `/bkd/ajar`,
      `/bkd/tunjang`, `/bkd/pengmas`, dan `/bkd/penelitian` dengan query
      `id_sdm` + `id_smt` serta 9 field response terdokumentasi.
- [x] Adapter live memakai enam path tetap dan query yang didokumentasikan;
      tidak ada generic proxy.
- [x] Fixture, service safe DTO, protected tRPC procedures, dan route `/bkd`
      tersedia dalam folder module `bkd`.
- [x] UI memilih SDM/semester dari referensi, membedakan loading, empty, error,
      source, dan memuat tab aktivitas secara lazy.
- [x] Test schema, adapter, service, dan router lulus.
- [ ] Response live BKD belum diuji karena credential dan UAT belum tersedia.

## Penugasan read-only checkpoint: 2026-09-17

Checkpoint ini hanya mencakup `GET /penugasan` dan `GET /penugasan/{id}` pada
PDF halaman 209-210. Tidak ada endpoint write, pagination, atau field tambahan
yang dibuka.

- [x] Schema runtime list mengikuti 8 field response `/penugasan` dan query
      wajib `id_sdm` bertipe UUID.
- [x] Schema runtime detail mengikuti 8 field list ditambah 9 field detail
      yang didokumentasikan PDF.
- [x] Adapter live memakai path tetap dan hanya mengirim query `id_sdm` pada
      list; detail memakai ID path hasil list.
- [x] Fixture, service safe DTO, protected tRPC procedures, dan route
      `/penugasan` serta `/penugasan/{id_penugasan}` tersedia dalam folder module
      `penugasan`.
- [x] UI memilih SDM dari `/referensi/sdm`, membedakan loading, empty, error,
      unauthorized, not found, dan source.
- [x] Test schema, adapter, service, dan router lulus.
- [ ] Response live Penugasan belum diuji karena credential dan UAT belum
      tersedia.

## Pendidikan formal read-only checkpoint: 2026-09-17

Checkpoint ini hanya mencakup `GET /pendidikan_formal` dan
`GET /pendidikan_formal/{id}` pada PDF halaman 153-158. Endpoint POST, PUT,
DELETE, ajuan, pagination, dan binary download belum dibuka.

- [x] Schema runtime list mengikuti 7 field response, query wajib `id_sdm`
      bertipe UUID, dan `jenis_ajuan` bertipe integer sesuai PDF halaman 153.
- [x] Schema runtime detail mengikuti field pendidikan formal lengkap,
      `jenis_ajuan` bertipe string, dan metadata dokumen sesuai PDF halaman
      155-158.
- [x] Adapter live memakai path tetap dan hanya mengirim query `id_sdm` pada
      list; detail memakai ID path hasil list.
- [x] Fixture, service safe DTO, protected tRPC procedures, dan route
      `/pendidikan_formal` serta `/pendidikan_formal/{id_pendidikan_formal}`
      tersedia dalam folder module `pendidikan_formal`.
- [x] UI memilih SDM dari `/referensi/sdm`, membedakan loading, empty, error,
      unauthorized, forbidden, not found, dan source.
- [x] Test schema, adapter, service, dan router lulus.
- [ ] Response live Pendidikan Formal belum diuji karena credential dan UAT
      belum tersedia.

## Riwayat pekerjaan read-only checkpoint: 2026-09-17

Checkpoint ini hanya mencakup `GET /riwayat_pekerjaan` dan
`GET /riwayat_pekerjaan/{id}` pada PDF halaman 260-263. Endpoint POST, PUT,
DELETE, pagination, dan binary download belum dibuka.

- [x] Schema runtime list mengikuti 9 field response `/riwayat_pekerjaan` dan
      query wajib `id_sdm` bertipe UUID.
- [x] Schema runtime detail mengikuti 9 field list ditambah field detail
      `id_sdm`, `id_bidang_usaha`, `id_jenis_pekerjaan`, `deskripsi_kerja`,
      dan metadata dokumen.
- [x] Adapter live memakai path tetap dan hanya mengirim query `id_sdm` pada
      list; detail memakai ID path hasil list.
- [x] Fixture, service safe DTO, protected tRPC procedures, dan route
      `/riwayat_pekerjaan` serta
      `/riwayat_pekerjaan/{id_riwayat_pekerjaan}` tersedia dalam folder module
      `riwayat_pekerjaan`.
- [x] UI memilih SDM dari `/referensi/sdm`, membedakan loading, empty, error,
      unauthorized, forbidden, not found, dan source.
- [x] Test schema, adapter, service, dan router lulus.
- [ ] Response live Riwayat Pekerjaan belum diuji karena credential dan UAT
      belum tersedia.

## UI state standardization checkpoint: 2026-09-18

Checkpoint ini melanjutkan item "Bedakan loading, empty, error, unauthorized,
dan stale cache" pada MVP read-only. Cakupannya hanya konsistensi visual dan
semantic tone, bukan stale cache indicator.

- [x] Primitive `State` (`src/component/ui/state.tsx`) menambah prop `icon`
      opsional untuk selection/empty state yang sebelumnya memakai markup ad
      hoc.
- [x] Widget dan halaman berikut memakai `State` untuk loading/empty/error,
      menggantikan `div` ad hoc yang sebelumnya berbeda-beda per module:
      `pegawai_search_widget`, `pegawai_detail_page`, `bkd_workspace_widget`,
      `pendidikan_formal_workspace_widget`, `pendidikan_formal_detail_page`,
      `penugasan_workspace_widget`, `penugasan_detail_page`, `referensi_page`,
      `riwayat_pekerjaan_workspace_widget`, `riwayat_pekerjaan_detail_page`,
      `security_audit_page`.
- [x] Error tRPC dengan code `UNAUTHORIZED`/`FORBIDDEN` pada
      `pendidikan_formal`, `riwayat_pekerjaan`, dan `security.audit_list`
      memakai tone `forbidden` yang berbeda secara visual dari error umum;
      `NOT_FOUND` memakai tone `unavailable`.
- [x] `bun run typecheck` dan `bun run lint` lulus setelah refactor.
- [x] Stale cache sekarang punya indikator UI: `component/ui/data_freshness.tsx`
      (baru, 2026-09-18) menampilkan "Diperbarui X lalu" dari
      `query.dataUpdatedAt`, plus titik warning dan keterangan tambahan saat
      umur data melewati `staleTime` 60 detik yang sama dengan
      `src/lib/trpc.tsx`. Dipasang di hasil pencarian pegawai serta panel
      Profil PT dan Semester pada `/referensi`; belum dipasang di semua
      halaman list lain.
- [ ] Browser QA light/dark pada breakpoint 1280/1024/390/320 belum
      dilakukan untuk perubahan ini.

## Referensi bertingkat checkpoint: 2026-09-18

Checkpoint ini melengkapi item "GET satu atau lebih referensi bertingkat yang
dibutuhkan halaman" pada MVP read-only, memakai `GET /referensi/wilayah`
(PDF halaman 256) sebagai contoh pertama.

- [x] Schema runtime mengikuti query wajib `id_level_wilayah` (enum 0-3
      sesuai PDF: Negara, Provinsi, Kota/Kabupaten, Kecamatan) dan tiga field
      response `id`, `nama`, `id_induk_wilayah`.
- [x] Adapter live memakai path tetap `/referensi/wilayah` dan hanya
      mengirim query `id_level_wilayah`; tidak ada parameter tambahan yang
      tidak terdokumentasi.
- [x] Fixture menyediakan 4 level bertingkat (Negara -> Provinsi ->
      Kota/Kabupaten -> Kecamatan) yang saling terhubung lewat
      `id_induk_wilayah` sehingga UI dapat didemonstrasikan tanpa credential.
- [x] Halaman `/referensi` menambah panel "Wilayah (referensi bertingkat)"
      dengan 4 `Select` berjenjang; setiap level baru difilter di client
      berdasarkan `id_induk_wilayah` terhadap level induk yang dipilih,
      sesuai catatan `architecture.md` ("referensi bertingkat dimuat sesuai
      parent ID").
- [x] Test schema, adapter, service, dan router (termasuk penolakan
      `id_level_wilayah` di luar 0-3) lulus lewat `bunx vitest run`.
- [x] Endpoint diverifikasi end-to-end pada dev server fixture mode
      (`GET /api/trpc/referensi.get_wilayah`) untuk level 0 dan 1; hasil
      level 1 seluruhnya memiliki `id_induk_wilayah` yang cocok dengan `id`
      level 0.
- [ ] Response live `/referensi/wilayah` belum diuji karena credential dan
      UAT belum tersedia.
- [ ] `/referensi/detail_unit_kerja`, `/referensi/mahasiswa_pddikti`,
      `/referensi/kategori_kegiatan`, `/referensi/kelompok_bidang`, dan
      `/referensi/media_publikasi` pada tabel `schema.md` 5.4 belum
      diimplementasikan.

Tambahan 2026-09-18: `GET /referensi/perguruan_tinggi` (PDF halaman 231, tanpa
parameter) dan `GET /referensi/unit_kerja` (PDF halaman 232, query wajib
`id_perguruan_tinggi` UUID) sebagai contoh kedua.

- [x] Schema runtime `unit_kerja` mengikuti `id_jenis_unit` enum 1-8 sesuai
      PDF dan menolak nilai di luar itu; `perguruan_tinggi` mengikuti dua
      field `id`/`nama`.
- [x] Adapter live `unit_kerja` hanya mengirim query `id_perguruan_tinggi`;
      `perguruan_tinggi` tanpa parameter, keduanya path tetap.
- [x] Berbeda dari `wilayah`, `unit_kerja` benar-benar difilter oleh SISTER
      di server melalui query `id_perguruan_tinggi`, bukan difilter di
      client; UI memilih perguruan tinggi lebih dulu sebelum unit kerja
      di-query.
- [x] Halaman `/referensi` menambah panel "Unit kerja (referensi
      bertingkat)" dengan dua `Select` berjenjang.
- [x] Test schema, adapter, service, dan router (termasuk penolakan
      `id_perguruan_tinggi` yang bukan UUID) lulus lewat `bunx vitest run`.
- [ ] Response live `/referensi/perguruan_tinggi` dan `/referensi/unit_kerja`
      belum diuji karena credential dan UAT belum tersedia.

## MVP read-only UX audit checkpoint: 2026-09-18

- [x] Audit source (`grep` untuk `useMutation`, `.mutate(`, dan label tombol
      Hapus/Edit/Ubah/Simpan/Tambah/Ajukan) menunjukkan tidak ada satu pun
      `useMutation` atau tombol mutation pada `src/modules/**/widget` dan
      `src/modules/**/page`; satu-satunya match adalah `created_at` (bukan
      "create") dan teks bantuan "Ubah kata kunci" pada empty state
      pencarian, bukan aksi mutation.
- [x] Audit source menunjukkan setiap route detail
      (`src/app/pegawai/[id_sdm]`, `.../penugasan/[id_penugasan]`,
      `.../pendidikan_formal/[id_pendidikan_formal]`,
      `.../riwayat_pekerjaan/[id_riwayat_pekerjaan]`) membaca ID dari
      parameter dinamis Next.js App Router (`params`), bukan dari state
      client-only, sehingga navigasi langsung ke URL dan refresh browser
      selalu menghasilkan konteks yang sama.
- [ ] Browser QA manual (refresh sungguhan pada tiap route detail) belum
      dilakukan; evidence saat ini adalah source-level check.

## Halaman dan UX MVP checkpoint: 2026-09-18

Lima perbaikan kecil-menengah yang menutup sebagian besar item section 5,
masing-masing dengan commit terpisah.

- [x] `BkdWorkspaceWidget` memakai primitive `Tabs` (bukan `role="tab"` hasil
      tulis tangan) untuk lima tab aktivitas BKD, sehingga arrow key/Home/End
      navigation ikut berfungsi sesuai kontrak `design-system.md`.
- [x] Dashboard (`OverviewPage`) memuat stat "SDM terindeks" dari
      `pegawai.search` sungguhan (loading/error state, bukan angka statis);
      dua stat lain tetap dash karena belum ada sumber data ajuan/sinkronisasi
      nyata. Header action button memakai component `Button` bersama, bukan
      `<button>` mentah.
- [x] Icon-only button yang sebelumnya hanya punya `aria-label` (toggle
      sidebar mobile, tombol prev/next `Pagination`) sekarang juga punya
      `title` sebagai tooltip, konsisten dengan `Dialog` dan `ThemeToggle`
      yang sudah benar.
- [x] `ReportChart` (sempat dibuat tapi tidak pernah dipakai) sekarang
      memvisualisasikan SKS kinerja vs lebih per unsur pada laporan akhir
      BKD sebagai bar chart; menambah prop `type` opsional dan reduced
      motion tanpa mengubah default pemakaian sebelumnya (belum ada).
- [x] Halaman detail SDM (`/pegawai/{id_sdm}`) menambah tab Ringkasan,
      Penugasan, Pendidikan Formal, Riwayat Pekerjaan, dan BKD yang tetap
      berada dalam konteks SDM yang sama; empat workspace widget module lain
      menerima prop opsional `sdmId` yang menyembunyikan selector SDM
      miliknya sendiri dan langsung query dengan `id_sdm` dari halaman induk
      saat dipakai lewat tab ini. Widget yang sama tetap bisa dipakai berdiri
      sendiri (dengan selector) di halaman module masing-masing.
- [x] `bun run typecheck`, `bun run lint`, dan `bunx vitest run` (94/94)
      lulus setelah kelima perubahan; endpoint tRPC yang relevan diverifikasi
      langsung lewat dev server fixture mode.
- [ ] Tidak ada akses browser di sesi ini untuk QA visual/keyboard sungguhan
      atas Tabs baru; verifikasi dilakukan lewat source review, typecheck,
      dan pemanggilan endpoint tRPC yang mendasari tiap tab secara langsung.

## SISTER HTTP client SSRF checkpoint: 2026-09-18

- [x] `sisterGet`/`buildSisterUrl` (`src/server/sister/http_client.ts`) menolak
      path adapter yang tidak diawali `/`, menolak path relative-protocol
      (`//host/...`) yang resolve ke origin berbeda dari `base_url`
      terkonfigurasi, hanya mengizinkan `https:`, dan memakai `redirect:
      "error"` sehingga tidak ada redirect outbound yang diikuti otomatis.
- [x] `src/server/sister/http_client.test.ts` (baru, 8 test) memverifikasi
      guard tersebut, header `Authorization: Bearer`, query yang mengirim
      hanya nilai terdefinisi, serta error mapping untuk 204, non-JSON,
      body tidak valid, status non-2xx, dan response yang tidak sesuai
      schema.
- [ ] Validasi ini tidak memblokir base_url yang sudah dikonfigurasi ke IP
      internal/private (SSRF via misconfigured env var); `base_url` tetap
      dipercaya sebagai nilai server-side, bukan input pengguna. DNS
      rebinding protection belum ditambahkan.

## Token provider TTL checkpoint: 2026-09-18

- [x] `src/server/sister/token_provider.test.ts` (baru, 6 test) memverifikasi
      `getSisterToken` men-cache token dengan `expires_at` sekitar 60 menit
      ke depan, tidak memanggil `/authorize` ulang selama cache masih valid,
      men-dedupe pemanggil bersamaan (concurrent) ke satu request
      `/authorize` yang sama, menolak berjalan pada fixture mode/base_url
      kosong, dan memetakan error `/authorize` (status non-2xx, body bukan
      JSON, response tidak sesuai schema) ke `SisterApiError` /
      `SisterContractError` yang sesuai.
- [ ] Refresh safety window (60 detik sebelum expiry) belum diuji lewat
      manipulasi waktu (fake timers); evidence saat ini hanya mencakup path
      cache-hit dan cache-miss awal.

## tRPC output DTO safety checkpoint: 2026-09-18

- [x] `src/server/security/output_safety.test.ts` (baru) memindai seluruh
      `src/modules/**/api/*_router.ts` dan `*_service.ts`: menegaskan tidak
      ada satupun yang menyebut `bearer`, `credential_ref`, `password`, atau
      `SISTER_PASSWORD`, dan tidak ada satupun yang meng-import
      `@prisma/client` atau `server/db/prisma` secara langsung (hanya
      `repository/*.ts` yang boleh menyentuh Prisma). Test ini adalah
      regression guard, bukan hanya audit satu kali.
- [x] Review source menunjukkan setiap router hanya melakukan input
      validation (Zod), auth (`protectedProcedure`/`adminProcedure`), dan
      delegasi `try/catch` ke fungsi `*_service.ts`; tidak ada query Prisma
      atau logika bisnis langsung di file router.
- [x] `grep` untuk `console.log/error/warn/info` di seluruh `src` (di luar
      test) tidak menemukan satupun structured logger; satu-satunya jalur
      audit adalah `security_audit_event` yang redaction-nya sudah diuji di
      checkpoint sebelumnya ("Security audit readback checkpoint").
- [ ] Item "Redact credential, token, dan PII pada structured log" belum
      relevan diuji karena belum ada logger aplikasi umum di luar
      `security_audit_event`; akan perlu evidence baru begitu logger
      ditambahkan.

## Sidebar role-gating checkpoint: 2026-09-18

- [x] Procedure baru `overview.session` (protected) mengembalikan hanya
      `{ role }` dari `ctx.user`, tidak ada field session lain yang
      terekspos ke client.
- [x] `Sidebar` mengambil role lewat `overview.session` dan menyembunyikan
      item navigasi "Audit security" (`requiresAdmin: true`) selama role
      belum diketahui atau bukan `ADMIN`, alih-alih menampilkannya ke semua
      role lalu mengandalkan halaman `/audit` menampilkan state forbidden.
- [x] Test router: `overview.session` menolak unauthenticated dan
      mengembalikan role yang sesuai untuk caller ber-session.
- [ ] Ini baru membedakan ADMIN vs non-ADMIN untuk satu item navigasi;
      belum ada state VIEWER/REVIEWER/OPERATOR yang berbeda satu sama lain
      di halaman manapun karena belum ada fitur yang butuh granularitas itu.
      Item checklist ini masih dianggap belum selesai.

## Bounded GET retry checkpoint: 2026-09-18

- [x] `sisterGet` (`src/server/sister/http_client.ts`) sekarang membungkus
      `fetch` dengan `fetchWithBoundedRetry`: maksimal 3 percobaan dengan
      jeda 200ms/400ms, dan hanya retry saat `fetch` sendiri throw (network
      failure/DNS/timeout abort) — bukan saat response sudah diterima,
      termasuk response error 4xx/5xx yang tetap dianggap jawaban final dan
      tidak di-retry.
- [x] Tidak ada perubahan pada mutation karena belum ada endpoint write;
      begitu ada mutation, kontrak `architecture.md` ("POST/PUT/DELETE tidak
      boleh di-retry otomatis") tetap berlaku dan `fetchWithBoundedRetry`
      sengaja hanya dipakai di jalur `sisterGet`, bukan jalur POST/PUT/DELETE
      di masa depan.
- [x] 3 test baru di `http_client.test.ts` (retry lalu berhasil, retry habis
      lalu throw, tidak retry setelah response non-2xx diterima) lulus lewat
      `bunx vitest run`.

## Router test coverage parity checkpoint: 2026-09-18

- [x] `pegawai_router.ts` adalah satu-satunya router tanpa test langsung
      (semua router lain sudah punya `*_router.test.ts`); ditambahkan
      `pegawai_router.test.ts` (4 test) yang menguji `search` + `get_detail`
      lewat `appRouter.createCaller`, mapping `id_sdm` tidak dikenal ke
      `NOT_FOUND`, penolakan `id_sdm` non-UUID sebelum masuk service layer,
      dan penolakan unauthenticated caller untuk kedua procedure.
- [x] Sekarang ke-8 router (bkd, overview, pegawai, pendidikan_formal,
      penugasan, referensi, riwayat_pekerjaan, security) punya test yang
      memverifikasi auth context (unauthenticated -> UNAUTHORIZED) dan
      bentuk DTO output lewat caller sungguhan, bukan hanya lewat service
      layer secara terpisah.

## Live SISTER, replika, dan login checkpoint: 2026-09-29

- [x] `POST /authorize` live berhasil di sandbox dan production dengan role
      `Sister-WS Basic`; base URL `sister-api.kemdiktisaintek.go.id`.
      Non-production otomatis memakai `SISTER_BASE_URL_DEV` (sandbox).
- [x] Schema `types.ts` divalidasi terhadap payload live 10 SDM dan
      disesuaikan (null, string numerik, `profil_pt` objek, `{}` pada
      `perguruan_tinggi`); daftar penyimpangan di
      [sister_replica.md](./sister_replica.md).
- [x] Replika read-only: `bun run sister:sync` untuk 135 dari 140 endpoint
      GET, tabel `sister_sync_run`, `sister_replica_record`,
      `sister_replica_scope`, inkremental per child, soft delete, dry-run.
      Unit test orkestrator dan fetcher (retry 5xx, reauthorize 401).
- [x] BKD: semester diambil dari `laporan_akhir_bkd` karena
      `/referensi/semester` selalu 500; 404 aktivitas = daftar kosong.
- [x] Login lokal better-auth (email + password, tanpa sign-up, sesi 8 jam,
      rate limit sign-in, akun nonaktif ditolak, event login/logout ke
      `security_audit_event`), halaman `/login`, logout, middleware redirect,
      CLI `bun run auth:create-user`.
- [x] Migration `20260929120000_sister_replica` dan
      `20260929130000_app_auth` diterapkan ke database lokal (role
      `sister_app`, bukan superuser); sync 2 SDM ke database: 1.417 request
      pertama, 154 request pada run inkremental berikutnya.
- [x] `next build` production lulus (termasuk `/login`, `/api/auth`,
      middleware).
- [x] Pacing `RateGate` (default 4 req/detik, jeda bersama saat 429):
      12 SDM = 3.478 request dalam 875 detik tanpa satu pun 429, setelah run
      tanpa pacing sebelumnya diblokir SISTER.
- [x] Jelajah data live `/jelajah` untuk semua modul GET (katalog server-side,
      role ADMIN/OPERATOR, panel struktur data + usulan tipe PostgreSQL),
      diuji ke sandbox untuk seluruh modul per SDM dan referensi.
- [x] Lapisan typed schema `replica`: 171 view (36 view anak) dihasilkan
      `bun run replica:views` dari payload asli; cast aman `replica.try_*`,
      kolom kode tetap text, 540 kolom typed tanpa cast yang hilang, replay
      migration dari nol lulus. Dokumen: `replica_schema.md`.
- [x] Halaman `/replika` (Data Replika, dari view `replica`) dan
      `/replika/status` (riwayat sync + scope gagal, ADMIN/OPERATOR).
- [x] Ikhtisar dari replika: KPI + grafik luaran, status SDM, BKD per
      semester (palet tervalidasi terang/gelap, tampilan tabel), dirender dan
      diperiksa lewat Chrome headless.
- [x] Semua 140 endpoint GET PDF punya jalur baca: 135 replika + Jelajah,
      2 route file (foto, unduh dokumen), 3 pencarian live (kolaborator,
      mahasiswa PDDIKTI); dijaga test cakupan terhadap daftar PDF.
- [x] Sync tunggal: advisory lock + heartbeat 30 detik, run kedua exit 3,
      run crash ditandai FAILED; progres tampil di `/replika/status`.
- [ ] Cek `/referensi/mahasiswa_pddikti` di production (sandbox selalu `{}`).
- [x] Full sync 97 SDM pertama dijalankan lokal; hasil parsial dengan exception
      eksternal. Bukan bukti semua scope berhasil.
- [x] Halaman replika dan status sinkronisasi tersedia.
- [ ] Migrasikan seluruh UI khusus/tRPC bisnis ke replika (UI-DATA).

## Checklist portable lama (bukan urutan task aktif)

Item selesai/tergantikan ditelusuri melalui checkpoint terbaru. Bagian write,
upload dan rekonsiliasi di bawah hanya template untuk project lain yang memang
membutuhkannya; tidak boleh dijalankan sebagai perluasan scope Sisterbridge.

## 0. Gate kontrak eksternal

- [ ] Identifikasi perguruan tinggi target dan instance SISTER yang akan dipakai.
- [ ] Dapatkan base URL API resmi untuk instance tersebut.
- [ ] Dapatkan YAML API resmi, bukan hanya PDF hasil generate.
- [ ] Konfirmasi API version yang aktif pada instance.
- [ ] Dapatkan credential UAT yang aman untuk role WS-BASIC atau WS-PRO.
- [ ] Konfirmasi arti dan kepemilikan id_pengguna.
- [ ] Panggil POST /authorize pada environment UAT dan catat role hasilnya
      tanpa menyimpan credential di repository.
- [ ] Konfirmasi apakah aplikasi memerlukan login lokal, SSO SISTER, atau
      keduanya.
- [ ] Konfirmasi ukuran file, MIME type, dan aturan upload tiap jenis dokumen.
- [ ] Konfirmasi timeout, rate limit, dan kebijakan maintenance instance.
- [ ] Konfirmasi metadata pagination pada lima endpoint yang mencantumkan
      per_page dan page.
- [ ] Validasi endpoint /data_pribadi/ajuan yang dirujuk PDF tetapi tidak
      muncul pada indeks.
- [ ] Validasi nested bidang_ilmu PUT pada domain yang dinyatakan read-only.
- [ ] Catat perbedaan response aktual dengan PDF sebagai contract issue.

## 0.1 Security gate sebelum coding

Detail control dan evidence ada di [security.md](./security.md). Semua item
berikut harus memiliki owner dan evidence; jangan mencentang hanya karena
library atau tabel sudah dibuat.

- [ ] Tetapkan asset classification untuk session, credential, token, PII,
      dokumen, database, log, dan audit.
- [ ] Gambar trust boundary browser -> Next/tRPC -> service -> Prisma/SISTER.
- [ ] Dokumentasikan threat model untuk auth takeover, IDOR, cross-PT access,
      CSRF, XSS, injection, SSRF, malicious file, replay, dan secret leakage.
- [ ] Tetapkan security invariant SEC-01 sampai SEC-12 atau sesuaikan dengan
      project profile external system.
- [ ] Pilih auth/session provider, cookie policy, CSRF strategy, rate limit,
      secret manager, log sink, dan security reviewer.
- [ ] Tetapkan kebijakan PII minimization, encryption, retention, backup, dan
      restore untuk database/log/audit.
- [ ] Tetapkan severity, accepted-risk owner, due date, dan compensating control.
- [ ] Buat security audit plan untuk design, pull request, UAT, release, dan
      periodic review.

## 1. Foundation repository

- [ ] Inisialisasi Next.js, React, dan TypeScript.
- [ ] Tambahkan lint, format, unit test, dan typecheck.
- [ ] Tambahkan PostgreSQL dan Prisma untuk metadata lokal.
- [ ] Terapkan nama tabel dan kolom PostgreSQL lowercase `snake_case` melalui
      `@@map()` dan `@map()` bila diperlukan.
- [ ] Tambahkan `@trpc/server`, `@trpc/client`,
      `@trpc/tanstack-react-query`, `@tanstack/react-query`, dan Zod.
- [ ] Buat transport tRPC pada `app/api/trpc/[trpc]/route.ts`.
- [ ] Buat root router dan context tRPC yang memeriksa session, permission, dan
      integration context.
- [ ] Tambahkan environment example tanpa credential aktual.
- [ ] Terapkan struktur modul dari architecture.md.
- [ ] Buat module-first folder untuk setiap fitur, misalnya
      `src/modules/pegawai/{page,api,widget,repository,schema,type}`.
- [ ] Tempatkan primitive pada `src/component/ui/` dan widget generik pada
      `src/component/widget/`.
- [ ] Buat `src/const/theme.ts` sebagai sumber warna, font, dan chart palette.
- [ ] Salin token CSS dan global contract dari design-system.md.
- [ ] Implementasikan theme light, dark, dan system.
- [ ] Terapkan HTTPS-only production, Secure/HttpOnly/SameSite cookie, dan
      security headers termasuk CSP sesuai deployment.
- [ ] Terapkan default-deny CORS, CSRF protection untuk cookie mutation, body
      size limit, rate limit, timeout, dan concurrency limit.
- [ ] Tambahkan secret injection dari secret manager tanpa credential di
      repository, browser, build artifact, atau log.
- [ ] Implementasikan layout sidebar 224px, topbar, page header, dan responsive
      contract.
- [ ] Terapkan header 40px yang hanya berisi search global dan profil.
- [ ] Terapkan breadcrumb body maksimal 3 level dengan action/filter/search
      halaman rata kanan.
- [ ] Hapus title/deskripsi visual halaman yang sudah jelas dari breadcrumb.
- [ ] Hindari nested card dan jangan membungkus form filter dengan card.
- [ ] Tambahkan `apexcharts` dan `react-apexcharts`, lalu buat wrapper
      `ReportChart` client-only sesuai design-system.md.
- [ ] Implementasikan primitive Button, IconButton, Select, DatePicker,
      DataTable, StatusBadge, Dialog, Tabs, HelpTip, State, dan Pagination.
- [ ] Uji primitive dengan keyboard dan screen reader semantics.

## 2. Schema dan persistence lokal

- [ ] Implementasikan app_user.
- [ ] Implementasikan sister_integration dengan credential_ref.
- [ ] Implementasikan sister_reference_cache.
- [ ] Implementasikan sister_sdm_index_cache tanpa NIK, NPWP, alamat, atau
      data keluarga.
- [ ] Implementasikan sister_operation.
- [ ] Implementasikan `security_audit_event` terpisah dari `sister_operation`
      untuk auth, authorization, policy, secret, dan suspicious events.
- [ ] Implementasikan sister_ajuan_cache bila tracking ajuan masuk MVP.
- [ ] Implementasikan sister_document_reference bila metadata dokumen perlu
      ditampilkan lintas halaman.
- [ ] Tambahkan index untuk integration_id, id_sdm, external ID, status, dan
      fetched_at sesuai query aktual.
- [ ] Pastikan token SISTER tidak pernah dipersist sebagai plain text.
- [ ] Pastikan user aplikasi biasa tidak dapat mengubah/menghapus security audit
      dan perubahan audit dapat terdeteksi.
- [ ] Tambahkan retention policy untuk cache dan audit.

## 3. SISTER client dan security boundary

- [ ] Generate tipe dari YAML resmi setelah YAML tersedia.
- [x] Implementasikan token provider dengan TTL 60 menit.
- [ ] Implementasikan POST /authorize di server saja.
- [ ] Implementasikan header Bearer tanpa mengembalikan token ke browser.
- [ ] Implementasikan fetch wrapper untuk JSON, multipart, dan binary.
- [ ] Implementasikan router dan procedure tRPC per capability module, bukan
      generic proxy atau salinan 1:1 seluruh endpoint SISTER.
- [x] Pastikan router tRPC hanya mengatur input, auth, permission, dan delegasi
      ke service/use case.
- [x] Pastikan output tRPC berupa DTO yang aman dan tidak mengembalikan object
      Prisma mentah, bearer token, atau response sensitif penuh.
- [ ] Gunakan Route Handler khusus untuk upload multipart dan download binary.
- [x] Implementasikan parsing response 200, 204, dan error message/detail.
- [x] Implementasikan bounded retry untuk GET yang aman.
- [x] Blokir automatic retry untuk POST, PUT, dan DELETE yang hasilnya tidak
      pasti.
- [ ] Implementasikan request fingerprint lokal.
- [ ] Redact credential, token, dan PII pada structured log.
- [ ] Emit `security_audit_event` untuk login/session, authz denied, CSRF, rate
      limit, input/file rejection, secret failure, dan config change.
- [ ] Pastikan tRPC context memvalidasi session, actor, permission, dan
      integration/PT sebelum procedure berjalan.
- [x] Uji bahwa output tRPC tidak mengandung token, secret, raw Prisma object,
      atau PII yang tidak dibutuhkan.
- [ ] Tambahkan timeout yang dikonfirmasi pada gate kontrak.
- [x] Tambahkan SSRF protection dengan allowlist base URL.
- [x] Validasi scheme/host/IP dan matikan redirect outbound yang tidak diperlukan.
- [ ] Pastikan route internal tidak menerima arbitrary path proxy.

### 3.1 Boundary debugging

- [ ] Catat jalur debug setiap procedure: route tRPC -> router -> service/use
      case -> repository atau SISTER adapter.
- [ ] Catat jalur debug setiap halaman: route `app/` -> module `page/` ->
      widget -> component UI.
- [ ] Pastikan error boundary dan log correlation ID menunjukkan module serta
      procedure tanpa membocorkan credential.

## 4. MVP read-only

Scope awal yang disarankan:

- [x] GET /referensi/profil_pt untuk identitas PT.
- [x] GET /referensi/sdm untuk pencarian SDM.
- [x] GET /referensi/semester untuk filter semester.
- [x] GET /data_pribadi/profil/{id_sdm}.
- [x] GET /data_pribadi/kepegawaian/{id_sdm}.
- [x] GET /penugasan dengan detail bila dibutuhkan.
- [x] GET /pendidikan_formal dan detailnya.
- [x] GET /riwayat_pekerjaan dan detailnya.
- [x] GET /bkd/laporan_akhir_bkd.
- [x] GET /bkd/pendidikan, /ajar, /tunjang, /pengmas, dan /penelitian.
- [x] GET satu atau lebih referensi bertingkat yang dibutuhkan halaman.
- [ ] Bedakan loading, empty, error, unauthorized, dan stale cache.
- [x] Pastikan resource read-only tidak menampilkan tombol mutation.
- [x] Tambahkan route URL langsung yang bertahan setelah refresh.

MVP read-only harus divalidasi dahulu sebelum menambah write operation.

## 5. Halaman dan UX MVP

- [ ] Halaman login atau konfigurasi auth sesuai keputusan gate.
- [ ] Halaman dashboard ringkas dengan data yang benar-benar tersedia dari API.
- [x] Halaman pencarian SDM.
- [x] Halaman detail SDM dengan tabs yang tetap berada dalam konteks SDM.
- [x] Halaman BKD dengan filter semester.
- [x] Halaman referensi atau selector yang diperlukan oleh form.
- [x] Halaman status integrasi dan health check yang tidak membocorkan secret.
- [x] Gunakan `ReportChart` berbasis ApexCharts hanya untuk angka agregat yang
      benar-benar tersedia dari response SISTER.
- [ ] State permission untuk VIEWER, REVIEWER, OPERATOR, dan ADMIN.
- [x] Tooltip untuk icon-only button.
- [x] Tabel scroll horizontal hanya pada table shell.
- [ ] Test light/dark pada 1280, 1024, 390, dan 320 pixel.

## 6. Satu workflow write terpilih

Jangan membuka seluruh CRUD sebelum satu workflow lolos UAT.

- [ ] Pilih satu domain berdasarkan kebutuhan PT dan role credential.
- [ ] Tandai endpoint create, detail, update, delete, atau ajuan yang dipakai.
- [ ] Implementasikan schema Zod berdasarkan YAML/response aktual.
- [ ] Implementasikan form dengan field wajib, enum, date, dan batas panjang.
- [ ] Implementasikan selector referensi yang benar.
- [ ] Implementasikan fetch detail sebelum PUT.
- [ ] Implementasikan full payload untuk PUT.
- [ ] Implementasikan preservasi document ID.
- [ ] Implementasikan confirm untuk DELETE bila domain mendukung delete.
- [ ] Implementasikan response 204 tanpa JSON parse.
- [ ] Implementasikan mode WS-BASIC sebagai ajuan.
- [ ] Implementasikan mode WS-PRO sebagai perubahan langsung sesuai response.
- [ ] Catat semua mutation dalam sister_operation.
- [ ] Re-fetch detail/list setelah mutation berhasil.
- [ ] Uji duplicate 409 dan network outcome tidak pasti.

## 7. Dokumen

- [ ] Implementasikan file validation setelah aturan resmi dikonfirmasi.
- [ ] Terapkan extension allowlist, MIME/content sniffing, size limit, filename
      normalization, dan random storage key.
- [ ] Pastikan file tidak disimpan executable di web root dan download selalu
      memeriksa session, permission, ownership, serta document ID.
- [ ] Putuskan malware/DLP scanner dan catat limitation bila belum tersedia.
- [ ] Implementasikan POST /dokumen untuk file.
- [ ] Implementasikan POST /dokumen untuk tautan tanpa file.
- [ ] Implementasikan attach document ID ke payload utama.
- [ ] Implementasikan metadata detail.
- [ ] Implementasikan binary download melalui server route.
- [ ] Pastikan browser tidak menyimpan bearer token untuk download.
- [ ] Catat document ID bila operasi utama gagal.
- [ ] Tentukan dan dokumentasikan cleanup orphan document dengan konfirmasi.

## 8. Ajuan dan rekonsiliasi

- [ ] Buat adapter status ajuan untuk tiap resource yang memiliki endpoint
      /ajuan.
- [ ] Tampilkan jenis ajuan Baru, Ubah, dan Hapus.
- [ ] Tampilkan tanggal ajuan, tanggal verifikasi, umur, status, dan keterangan.
- [ ] Tampilkan detail_perubahan bila tersedia.
- [ ] Bedakan data master dengan data ajuan.
- [ ] Sediakan refresh manual status ajuan.
- [ ] Sediakan daftar operasi NEEDS_REVIEW.
- [ ] Sediakan pemeriksaan ulang berdasarkan external ID atau fingerprint.
- [ ] Jangan retry otomatis mutation dengan hasil yang belum diketahui.

## 9. Perluasan domain setelah MVP

Setiap domain berikut hanya boleh dikerjakan setelah masuk PRD release yang
jelas dan memiliki UAT:

- [ ] Anggota Profesi.
- [ ] Bahan Ajar.
- [ ] Beasiswa.
- [ ] Detasering.
- [ ] Diklat.
- [ ] Inpassing.
- [ ] Jabatan Fungsional.
- [ ] Jabatan Struktural.
- [ ] Kekayaan Intelektual.
- [ ] Kesejahteraan.
- [ ] Kolaborator Eksternal.
- [ ] Orasi Ilmiah.
- [ ] Pembicara.
- [ ] Penelitian.
- [ ] Pengabdian.
- [ ] Pengelola Jurnal.
- [ ] Penghargaan.
- [ ] Penunjang Lain.
- [ ] Publikasi.
- [x] Riwayat Pekerjaan.
- [ ] Sertifikasi Profesi.
- [ ] Nilai Tes dan ajuan.
- [ ] Tugas Tambahan.
- [ ] Tunjangan.
- [ ] Visiting Scientist.
- [ ] Kelas Kuliah dan dokumen tautan.

Domain bimbing dosen, bimbingan mahasiswa, pengajaran, dan pengujian mahasiswa
harus memiliki keputusan khusus untuk nested bidang_ilmu karena PDF sekaligus
menyatakan data bersumber PDDIKTI/read-only dan menyediakan beberapa PUT.

## 10. Quality, security, dan release

- [ ] Unit test payload dan error mapping.
- [ ] Contract test terhadap YAML resmi.
- [ ] Integration test dengan UAT.
- [x] Unit/integration test untuk procedure tRPC, auth context, permission, dan
      DTO output.
- [ ] Browser test untuk happy path dan semua state UI.
- [ ] Test access control pada setiap internal API route.
- [ ] Test token expiry.
- [ ] Test 204, 400, 401, 403, 404, 405, 409, dan 500.
- [ ] Test upload, download, dan MIME behavior.
- [ ] Test timeout dengan outcome NEEDS_REVIEW.
- [ ] Audit unauthenticated, wrong-role, IDOR, cross-user, dan cross-PT/
      integration access.
- [ ] Audit CSRF/CORS, rate limit, request size, malformed input, error
      disclosure, XSS, injection, SSRF, open redirect, dan path traversal.
- [ ] Audit secret/token presence pada client bundle, network, storage, log,
      cache, error, database, backup, dan artifact.
- [ ] Review Prisma migration, raw query, DB runtime privilege, backup/restore,
      dan access control `security_audit_event`.
- [ ] Jalankan dependency audit, secret scan, container/CI review, HTTPS,
      cookie, CSP, dan security header verification.
- [ ] Lakukan security audit readback: event dibuat, dapat ditelusuri dengan
      request ID, tidak menyimpan secret, dan perubahan/penghapusan terdeteksi.
- [ ] Audit log tidak mengandung secret atau PII berlebihan.
- [ ] Dependency audit dan secret scan.
- [ ] HTTPS reverse proxy tervalidasi.
- [ ] Backup database terenkripsi dan restore test.
- [ ] Runbook credential rotation.
- [ ] Dokumentasikan perbedaan source test, UAT, browser QA, dan production
      evidence.

## Deployment VPS checkpoint

- [x] Dockerfile multi-stage berbasis Bun dan Next standalone tersedia.
- [x] Compose PostgreSQL 17 dengan healthcheck dan volume persisten tersedia.
- [x] Web container bind ke localhost dan dapat memakai `WEB_HOST_PORT` untuk
      menghindari konflik port host.
- [x] Web menjalankan `prisma migrate deploy` sebelum server production.
- [x] `.dockerignore` mencegah `.env`, PDF, dependency lokal, dan output build
      masuk ke build context.
- [x] Runbook `/opt/apps/sisterbridge` tersedia di
      `cookbook/deployment_vps.md`.
- [ ] Docker image build dan `docker compose config` diverifikasi pada VPS/CI
      yang memiliki Docker.
- [ ] Nginx HTTPS, DNS, dan certificate production dikonfigurasi.
- [ ] `.env` VPS diisi dengan credential SISTER UAT/live yang valid.
- [ ] Auth/session provider production diaktifkan sebelum data PII dibuka.

## 11. Definition of done

Satu fitur SISTER dianggap selesai apabila:

1. endpoint dan field-nya ada pada YAML atau sudah divalidasi di UAT;
2. schema, architecture, PRD, TODO, dan security contract konsisten;
3. permission dan role behavior jelas;
4. loading, empty, error, success, forbidden, dan stale state tersedia;
5. scope aktif hanya GET; write hanya bila ada perubahan scope produk terpisah;
6. dokumen dan status ajuan ditangani bila relevan;
7. unit/contract/integration test sesuai levelnya lulus;
8. browser QA design system lulus;
9. module, component, dan widget berada pada boundary folder yang disepakati;
10. table dan column database fisik mengikuti `snake_case`;
11. tidak ada token atau credential pada client/log;
12. security audit memiliki status, evidence, owner, dan residual risk yang
    jelas;
13. tidak ada finding Critical/High yang belum memiliki keputusan tertulis;
14. hasil production readiness tidak diklaim dari test lokal saja.

## 12. Explicit out of scope

- scraping halaman SISTER;
- login dosen individual tanpa dukungan SSO/API resmi;
- direct database SISTER;
- local master data yang tidak punya endpoint SISTER;
- sinkronisasi di luar GET dan batas PT yang telah disepakati;
- webhook/callback yang belum tersedia pada PDF;
- OCR, AI, dan enrichment eksternal;
- mobile app;
- payment atau workflow non-SISTER;
- analytics yang membutuhkan data yang tidak diberikan API.


## Progress implementasi UI (2026-10-01)

Route katalog kini membuka halaman bisnis berbasis replika untuk modul, direktori
SDM dan referensi, detail, pencarian langsung, BKD, laporan, peringatan, dan
status akses. Pemetaan endpoint diperbarui agar tidak lagi menyebut halaman
bisnis sebagai rencana. Ini adalah status implementasi source, bukan bukti
acceptance: checklist master dan paket UI tetap terbuka sampai role/tenant,
deep link, state data, responsive layout, keyboard, light/dark, dan alur file
diverifikasi melalui QA browser. QA tersebut belum dijalankan pada perubahan ini.
