# Pemetaan UI seluruh GET SISTER

Status: spesifikasi implementasi UI, 2026-09-30. **Bukan pernyataan bahwa UI
seluruh modul sudah selesai.** Berlaku untuk Sisterbridge di repository
`sister-integrated`; tujuan produk adalah report dan warning untuk admin PT.

## Cara memakai dan mengadaptasi

Pola portable: inventaris setiap operasi baca, tentukan kebutuhan pengguna,
owner modul, halaman, widget, dependensi ID, sumber data, permission, state,
dan bukti penerimaan. Saat dipindah ke repo lain, ganti inventaris dan profile
produk; jangan menyalin endpoint, role, atau aturan bisnis SISTER.

Untuk repo ini, daftar GET mengikuti
[`sister_get_endpoints.ts`](../src/server/sister/sister_get_endpoints.ts)
yang dipetakan dari PDF API 1.0.0. Sembilan file `sister_01`–`sister_09`
menyimpan rujukan halaman PDF. Bentuk response aktual dirujuk melalui
[replica_schema.md](./replica_schema.md) dan [sister_replica.md](./sister_replica.md).
Field dari sampel bukan jaminan selalu ada; verifikasi tipe/null dan data kosong
ketika membuat DTO. Jangan mengarang field untuk memenuhi rancangan visual.

Dokumen ini menjadi acuan coverage UI aktif bersama [prd_managerial.md](./prd_managerial.md) dan
[todo.md](./todo.md). Inventory POST/PUT/DELETE pada dokumen lama tetap
referensi kontrak; operasi tersebut bukan scope aplikasi managerial ini.
`POST /authorize` adalah kebutuhan autentikasi server, bukan mutation data.

## Baseline dan batas evidence

- 39 judul modul PDF; Akses tidak memiliki endpoint GET.
- 140 template GET: 135 JSON dalam mekanisme replika, 2 file live, 3
  pencarian/detail kolaborator atau mahasiswa yang tetap live.
- Implementasi read path bukan bukti seluruh scope berhasil atau semua UI
  lolos QA. Daftar kosong tidak membuktikan detail/child pernah dipanggil.
- Berdasarkan hasil sync sebelumnya: 97 SDM dan 134.856 record aktif lokal.
  Angka ini snapshot, bukan angka yang boleh di-hardcode di UI.
- Riwayat 74 scope 403 kelas kuliah cocok dengan kelas di PT lain; uji
  pembanding satu kelas PT sendiri menghasilkan 200 dengan 3 dokumen.
  Ini bukan 74 endpoint gagal dan tidak boleh diatasi dengan mengganti ID PT.
- 14 scope 500: 9 detail ajuan pendidikan formal dan 5 scope referensi.
  Peta di bawah mempertahankan halaman/state untuk endpoint gagal.
- GET berhasil dengan payload kosong, GET gagal, belum pernah sync,
  stale, dan record yang sudah dihapus adalah kondisi berbeda.
- `last_status=200` lokal belum cukup menjadi bukti upstream 200: orkestrator
  saat ini dapat menormalkan 404 menjadi scope kosong sukses. Perlu perbaikan
  pencatatan sebelum UI mengklaim kelengkapan absolut.
- `replica_schema.md` adalah hasil generator dari sampel 2026-09-29;
  jangan menganggap view/field otomatis ikut bertambah setelah full sync.

Evidence UI saat ini berasal dari pembacaan source, bukan QA browser seluruh
modul pada 2026-09-30:

| Permukaan saat ini | Yang tersedia | Yang belum membuktikan selesai |
|---|---|---|
| `/` | KPI dan ApexCharts dari replika | Drill-down report dan pusat warning menyeluruh |
| Pegawai, BKD, Penugasan, Pendidikan Formal, Riwayat Pekerjaan | Halaman khusus, beberapa tab/detail | Semua bagian data pokok/ajuan; read lokal konsisten; QA terbaru |
| `/referensi` | Beberapa referensi khusus | Direktori seluruh 41 endpoint referensi |
| `/replika` | Pilihan modul, tabel/view, detail dan array child | UX bisnis per modul; daftar dibatasi 5.000 baris; lima aktivitas BKD belum menjadi pilihan katalog |
| `/jelajah` | Live JSON, detail, bidang ilmu, pencarian | UX utama admin; pagination live dibatasi 20 × 100; bukan bukti semua baris sudah tampil |
| Foto/unduh | Widget/link pada explorer dan route file | Semua konteks dokumen/detail terhubung dan ownership diverifikasi |
| Sidebar | Menu utama dan halaman teknis | `#pengajuan` masih placeholder; tombol Pengaturan belum punya alur |
| Shell/halaman | Theme hijau, component dan widget bersama | Masih ada judul/deskripsi visual di explorer/status; beberapa batas lebar perlu diselaraskan |

Source pemeriksaan: [sidebar](../src/component/ui/sidebar.tsx),
[explorer](../src/component/widget/data_explorer_view.tsx),
[replika service](../src/modules/replika/api/replika_service.ts),
[jelajah service](../src/modules/jelajah/api/jelajah_service.ts),
[sync](../src/server/sister/replica/replica_sync.ts).
Coverage test saat ini memeriksa gabungan katalog read path; belum memeriksa
keterjangkauan seluruh endpoint dari UI.

## Navigasi dan pola halaman target

Sidebar berkelompok memakai grup pada tabel 39 modul berikut. Menu report dan
warning berada bersama Ikhtisar. Replika, Jelajah, dan Status Sinkronisasi
berada pada grup alat admin. Referensi mempunyai direktori sendiri; tiap
endpoint referensi menjadi subhalaman, bukan 41 menu utama terpisah.
Ajuan dibuka dari tab modul pemiliknya; tautan `#pengajuan` diganti navigasi
nyata atau dihapus sampai halaman tersedia. Tidak ada menu/tombol dummy.

Admin dapat membuka modul langsung dari sidebar, mencari SDM, membuka detail,
melihat bukti/data anak, dan kembali ke daftar tanpa kehilangan filter.
Kelas Kuliah dibuka dalam konteks Pengajaran dengan `id_kelas` yang valid;
tidak membuat endpoint list kelas fiktif. Akses memakai status integrasi,
bukan halaman yang menampilkan credential/token.

Pola implementasi:

- List: label bisnis, pilihan SDM dari data lokal, pencarian, filter relevan,
  tabel terkurasi dan pagination server. Tampilan lintas SDM boleh menjadi
  agregasi lokal bila unit hitung dan cakupan ditampilkan.
- Detail: route permanen, nama record pada breadcrumb, field berlabel,
  tanggal/angka terformat, section relasi dan dokumen. Field yang tidak ada
  diberi “Tidak tersedia”; jangan menebak nilai atau menyamakan null dengan 0.
- Ajuan: daftar/detail terpisah dari master; tampilkan jenis, status, tanggal
  dan keterangan yang benar-benar diberikan SISTER. Tidak ada submit/approve.
- Child bidang ilmu/dokumen/anggota/penulis/mahasiswa: widget tersendiri dalam
  detail, bukan JSON mentah atau ringkasan “[n item]” sebagai satu-satunya akses.
- Referensi: tabel kode–label terkurasi dan selector berelasi. Opsi yang
  unavailable tidak dianggap daftar sah yang kosong.
- File: foto dalam profil; preview/unduh dalam dokumen terkait, dimuat saat
  diminta. Tautan eksternal dokumen kelas ditampilkan hanya bila URL aman dan
  memang ada pada response, jangan menganggap setiap item punya ID unduhan.
- Semua filter, tab dan pagination disimpan di URL agar refresh/back/deep link
  mempertahankan konteks. Query di tabel matriks adalah URL aplikasi lokal;
  jangan meneruskannya sebagai parameter SISTER tanpa kontrak.

Route dan nama widget pada matriks adalah **target**, bukan klaim file sudah
ada. Widget list/detail mengikuti owner `src/modules/<owner>/widget/`;
route Next.js hanya entry tipis. Gunakan `component/ui/` untuk primitive,
`component/widget/` untuk composite berulang. Nama widget boleh disesuaikan
dengan widget existing yang setara saat implementasi; coverage tetap harus
ditelusuri per GET-ID.

## Modul dan kebutuhan admin

Fokus tampilan di bawah berlaku hanya untuk field yang tersedia di response
PDF/live. Filter periode, status, instansi, kategori, dan jenis ditambahkan
hanya jika field modul mendukung. Modul kosong tetap mempunyai halaman bisnis
dan state yang jelas; tidak diberi data contoh seolah-olah berasal dari SISTER.

| No. PDF | Modul | GET | Grup menu | Owner folder | Tampilan/fungsi admin target | Kondisi awal |
|---|---|---:|---|---|---|---|
| 01 | Akses | 0 | Sistem | `replika` | Status koneksi, role integrasi, dan sinkronisasi; login lokal terpisah | Fondasi auth/status ada |
| 02 | Anggota Profesi | 2 | Pengabdian dan penunjang | `anggota_profesi` | Daftar keanggotaan; organisasi, periode, detail, dan bukti yang tersedia | Explorer tersedia; UI khusus rencana |
| 03 | BKD | 6 | BKD | `bkd` | Laporan akhir per semester; lima tab aktivitas, angka SKS dan simpulan dari SISTER | Sebagian UI khusus ada |
| 04 | Bahan Ajar | 2 | Pengajaran dan bimbingan | `bahan_ajar` | Daftar bahan ajar; judul, jenis, tahun; detail penulis dan dokumen | Explorer tersedia; UI khusus rencana |
| 05 | Beasiswa | 2 | Pendidikan dan kompetensi | `beasiswa` | Riwayat beasiswa; jenis, penyelenggara, periode sesuai response | Explorer tersedia; UI khusus rencana |
| 06 | Bimbingan Dosen | 2 | Pengajaran dan bimbingan | `bimbing_dosen` | Daftar/detail pembimbingan dosen dan pihak terkait | Explorer tersedia; UI khusus rencana |
| 07 | Bimbingan Mahasiswa | 3 | Pengajaran dan bimbingan | `bimbingan_mahasiswa` | Daftar/detail bimbingan; mahasiswa, dosen, dan bidang ilmu | Explorer tersedia; UI khusus rencana |
| 08 | Data Pokok | 8 | SDM dan kepegawaian | `pegawai` | Profil SDM dengan foto dan tujuh bagian data pokok; bagian sensitif dibatasi | Sebagian UI khusus ada |
| 09 | Detasering | 2 | SDM dan kepegawaian | `detasering` | Riwayat penempatan detasering, instansi dan periode | Explorer tersedia; UI khusus rencana |
| 10 | Diklat | 2 | Pendidikan dan kompetensi | `diklat` | Daftar pelatihan, jenis, penyelenggara, periode dan dokumen | Explorer tersedia; UI khusus rencana |
| 11 | Dokumen | 3 | Dokumen | `dokumen` | Daftar metadata, detail, preview yang didukung, dan unduh | Explorer tersedia; UI khusus rencana |
| 12 | Inpassing | 2 | SDM dan kepegawaian | `inpassing` | Riwayat inpassing, informasi SK, tanggal dan bukti | Explorer tersedia; UI khusus rencana |
| 13 | Jabatan Fungsional | 4 | SDM dan kepegawaian | `jabatan_fungsional` | Riwayat jabatan dan tab ajuan terpisah dengan status dari SISTER | Explorer tersedia; UI khusus rencana |
| 14 | Jabatan Struktural | 2 | SDM dan kepegawaian | `jabatan_struktural` | Riwayat jabatan, unit, periode dan informasi SK | Explorer tersedia; UI khusus rencana |
| 15 | Kekayaan Intelektual | 3 | Penelitian dan publikasi | `kekayaan_intelektual` | Daftar karya, jenis, tahun; detail pihak terkait, dokumen dan bidang ilmu | Explorer tersedia; UI khusus rencana |
| 16 | Kelas Kuliah | 1 | Pengajaran dan bimbingan | `kelas_kuliah` | Daftar dokumen kelas dibuka dari pengajaran; label kelas dan sumber PT | Explorer tersedia; UI khusus rencana |
| 17 | Kepangkatan | 2 | SDM dan kepegawaian | `kepangkatan` | Riwayat pangkat/golongan, tanggal dan informasi SK | Explorer tersedia; UI khusus rencana |
| 18 | Kesejahteraan | 2 | Kesejahteraan | `kesejahteraan` | Daftar/detail kesejahteraan per SDM dengan data sensitif dibatasi | Explorer tersedia; UI khusus rencana |
| 19 | Kolaborator Eksternal | 2 | Pencarian | `kolaborator_eksternal` | Pencarian nama/NIK dan detail kolaborator; tidak ada daftar seluruh populasi | Explorer tersedia; UI khusus rencana |
| 20 | Orasi Ilmiah | 2 | Pengajaran dan bimbingan | `orasi_ilmiah` | Daftar/detail orasi, kegiatan, waktu dan dokumen | Explorer tersedia; UI khusus rencana |
| 21 | Pembicara | 2 | Pengabdian dan penunjang | `pembicara` | Daftar/detail kegiatan pembicara, peran, waktu dan bukti | Explorer tersedia; UI khusus rencana |
| 22 | Pendidikan Formal | 4 | Pendidikan dan kompetensi | `pendidikan_formal` | Riwayat pendidikan, jenjang, institusi; dokumen dan ajuan terpisah | Sebagian UI khusus ada |
| 23 | Penelitian | 3 | Penelitian dan publikasi | `penelitian` | Daftar penelitian; judul, tahun, kategori; anggota, pendanaan bila tersedia, bidang ilmu dan dokumen | Explorer tersedia; UI khusus rencana |
| 24 | Pengabdian | 3 | Pengabdian dan penunjang | `pengabdian` | Daftar pengabdian; judul, tahun, kategori; anggota, bidang ilmu dan dokumen | Explorer tersedia; UI khusus rencana |
| 25 | Pengajaran | 3 | Pengajaran dan bimbingan | `pengajaran` | Daftar pengajaran per semester, mata kuliah/kelas; detail, bidang ilmu dan dokumen kelas | Explorer tersedia; UI khusus rencana |
| 26 | Pengelola Jurnal | 2 | Penelitian dan publikasi | `pengelola_jurnal` | Daftar/detail jurnal, peran pengelola, periode dan bukti | Explorer tersedia; UI khusus rencana |
| 27 | Penghargaan | 2 | Pengabdian dan penunjang | `penghargaan` | Daftar/detail penghargaan, jenis, tingkat, tahun dan dokumen | Explorer tersedia; UI khusus rencana |
| 28 | Pengujian Mahasiswa | 3 | Pengajaran dan bimbingan | `pengujian_mahasiswa` | Daftar/detail pengujian; mahasiswa, dosen dan bidang ilmu | Explorer tersedia; UI khusus rencana |
| 29 | Penugasan | 2 | SDM dan kepegawaian | `penugasan` | Daftar/detail penempatan, PT/unit dan masa penugasan | Sebagian UI khusus ada |
| 30 | Penunjang Lain | 2 | Pengabdian dan penunjang | `penunjang_lain` | Daftar/detail kegiatan penunjang, peran, periode dan bukti | Explorer tersedia; UI khusus rencana |
| 31 | Publikasi | 3 | Penelitian dan publikasi | `publikasi` | Daftar publikasi; judul, jenis, tahun; penulis, bidang ilmu dan dokumen | Explorer tersedia; UI khusus rencana |
| 32 | Referensi | 41 | Referensi | `referensi` | Direktori referensi berlabel, profil PT dan hierarki unit/wilayah; pencarian mahasiswa terpisah | Sebagian UI khusus ada |
| 33 | Riwayat Pekerjaan | 2 | SDM dan kepegawaian | `riwayat_pekerjaan` | Riwayat pekerjaan, institusi, jabatan, periode dan dokumen | Sebagian UI khusus ada |
| 34 | Sertifikasi Dosen | 4 | Pendidikan dan kompetensi | `sertifikasi_dosen` | Daftar/detail sertifikasi dan tab ajuan read-only | Explorer tersedia; UI khusus rencana |
| 35 | Sertifikasi Profesi | 2 | Pendidikan dan kompetensi | `sertifikasi_profesi` | Daftar/detail sertifikasi, lembaga, bidang dan bukti | Explorer tersedia; UI khusus rencana |
| 36 | Tes | 4 | Pendidikan dan kompetensi | `nilai_tes` | Daftar/detail hasil tes dan tab ajuan; detail 404 dibedakan dari list kosong | Explorer tersedia; UI khusus rencana |
| 37 | Tugas Tambahan | 2 | SDM dan kepegawaian | `tugas_tambahan` | Daftar/detail tugas, jabatan, periode dan dokumen | Explorer tersedia; UI khusus rencana |
| 38 | Tunjangan | 2 | Kesejahteraan | `tunjangan` | Daftar/detail tunjangan per SDM; nilai/nominal hanya jika tersedia dan diizinkan | Explorer tersedia; UI khusus rencana |
| 39 | Visiting Scientist | 2 | Penelitian dan publikasi | `visiting_scientist` | Riwayat kegiatan, institusi tujuan, periode dan dokumen | Explorer tersedia; UI khusus rencana |

## Kontrak widget, sumber dan permission

Nama widget per endpoint merujuk tanggung jawab tampilan, bukan kewajiban
menduplikasi tabel. Modul menyimpan konfigurasi kolom/formatter/filter dan DTO;
`DataTable`, detail berlabel, section relasi, status data, serta chart digunakan
ulang. Page mengatur konteks dan komposisi widget saja.

Sumber target **Replika**: browser → tRPC → service modul → repository
PostgreSQL/view → DTO terkurasi. Sejumlah halaman khusus saat ini masih memakai
adapter live; migrasi ke read lokal adalah task tersendiri. Keberadaan data
lokal tidak otomatis membuat halaman tersebut offline-ready.

Sumber **Pencarian live**: hanya allowlist field nama/NIK atau prodi/keyword
dari form melalui server. Sumber **File live**: route handler server dengan
session, ownership, MIME/ukuran dan audit. UI memberi label ketergantungan
koneksi; tidak menjanjikan dua jenis sumber ini tersedia offline.

Target utama seluruh halaman bisnis adalah ADMIN. Role lain yang sudah ada
tetap mengikuti permission lokal server; perluasan tampilan data sensitif ke
OPERATOR/REVIEWER/VIEWER membutuhkan matriks field yang eksplisit. Terapkan
pengecekan role + integration/PT + relasi resource pada query dan route file,
termasuk deep link, filter dan agregasi. ADMIN lokal tidak memperluas hak
credential SISTER. Jangan menganggap menyembunyikan menu cukup untuk membatasi
akses. Status per baris pada matriks tidak menyatakan kontrol tersebut sudah
lolos audit.

## Matriks 140 endpoint GET

Satu baris per template GET; bukan satu baris per scope SDM/semester/record.
Kolom “Kondisi awal” adalah evidence source-level; semua baris masih menunggu
acceptance UI target. “Per scope” berarti keberhasilan terbaru harus dibaca
dari log/status tersimpan, bukan disimpulkan dari keberadaan endpoint.
Endpoint ber-error tetap punya target UI, retry yang terkontrol, serta
keterangan data parsial.

| ID | Endpoint SISTER (GET) | Owner | Route UI target | Widget target | Sumber target | Input/dependensi | Kondisi awal | Catatan runtime |
|---|---|---|---|---|---|---|---|---|
| GET-001 | `/anggota_profesi` | `anggota_profesi` | `/anggota_profesi` | `anggota_profesi_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-002 | `/anggota_profesi/{id}` | `anggota_profesi` | `/anggota_profesi/{id}` | `anggota_profesi_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-003 | `/bkd/laporan_akhir_bkd` | `bkd` | `/bkd?id_sdm={id_sdm}&tab=laporan_akhir_bkd` | `bkd_laporan_akhir_bkd_widget` | Replika | id_sdm dari SDM | UI khusus ada; migrasi replika/QA tersisa | Per scope; lihat status sinkronisasi |
| GET-004 | `/bkd/pendidikan` | `bkd` | `/bkd?id_sdm={id_sdm}&id_smt={id_smt}&tab=pendidikan` | `bkd_pendidikan_widget` | Replika | id_sdm dari SDM; id_smt dari laporan akhir | UI khusus ada; migrasi replika/QA tersisa | Per scope; lihat status sinkronisasi |
| GET-005 | `/bkd/ajar` | `bkd` | `/bkd?id_sdm={id_sdm}&id_smt={id_smt}&tab=ajar` | `bkd_ajar_widget` | Replika | id_sdm dari SDM; id_smt dari laporan akhir | UI khusus ada; migrasi replika/QA tersisa | Per scope; lihat status sinkronisasi |
| GET-006 | `/bkd/tunjang` | `bkd` | `/bkd?id_sdm={id_sdm}&id_smt={id_smt}&tab=tunjang` | `bkd_tunjang_widget` | Replika | id_sdm dari SDM; id_smt dari laporan akhir | UI khusus ada; migrasi replika/QA tersisa | Per scope; lihat status sinkronisasi |
| GET-007 | `/bkd/pengmas` | `bkd` | `/bkd?id_sdm={id_sdm}&id_smt={id_smt}&tab=pengmas` | `bkd_pengmas_widget` | Replika | id_sdm dari SDM; id_smt dari laporan akhir | UI khusus ada; migrasi replika/QA tersisa | Per scope; lihat status sinkronisasi |
| GET-008 | `/bkd/penelitian` | `bkd` | `/bkd?id_sdm={id_sdm}&id_smt={id_smt}&tab=penelitian` | `bkd_penelitian_widget` | Replika | id_sdm dari SDM; id_smt dari laporan akhir | UI khusus ada; migrasi replika/QA tersisa | Per scope; lihat status sinkronisasi |
| GET-009 | `/bahan_ajar` | `bahan_ajar` | `/bahan_ajar` | `bahan_ajar_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-010 | `/bahan_ajar/{id}` | `bahan_ajar` | `/bahan_ajar/{id}` | `bahan_ajar_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-011 | `/beasiswa` | `beasiswa` | `/beasiswa` | `beasiswa_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-012 | `/beasiswa/{id}` | `beasiswa` | `/beasiswa/{id}` | `beasiswa_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-013 | `/bimbing_dosen` | `bimbing_dosen` | `/bimbing_dosen` | `bimbing_dosen_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-014 | `/bimbing_dosen/{id}` | `bimbing_dosen` | `/bimbing_dosen/{id}` | `bimbing_dosen_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-015 | `/bimbingan_mahasiswa` | `bimbingan_mahasiswa` | `/bimbingan_mahasiswa` | `bimbingan_mahasiswa_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-016 | `/bimbingan_mahasiswa/{id}` | `bimbingan_mahasiswa` | `/bimbingan_mahasiswa/{id}` | `bimbingan_mahasiswa_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-017 | `/bimbingan_mahasiswa/{id}/bidang_ilmu` | `bimbingan_mahasiswa` | `/bimbingan_mahasiswa/{id}?tab=bidang_ilmu` | `bimbingan_mahasiswa_bidang_ilmu_widget` | Replika | id dari list/detail induk | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-018 | `/data_pribadi/foto/{id_sdm}` | `pegawai` | `/pegawai/{id_sdm}?tab=foto` | `foto_sdm_widget` | File live | id_sdm dari /referensi/sdm | Tautan/widget explorer ada; integrasi profil tersisa | Per scope; lihat status sinkronisasi |
| GET-019 | `/data_pribadi/profil/{id_sdm}` | `pegawai` | `/pegawai/{id_sdm}?tab=profil` | `pegawai_profil_widget` | Replika | id_sdm dari /referensi/sdm | UI sebagian ada; perlu perluasan/QA | Per scope; lihat status sinkronisasi |
| GET-020 | `/data_pribadi/kependudukan/{id_sdm}` | `pegawai` | `/pegawai/{id_sdm}?tab=kependudukan` | `pegawai_kependudukan_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-021 | `/data_pribadi/keluarga/{id_sdm}` | `pegawai` | `/pegawai/{id_sdm}?tab=keluarga` | `pegawai_keluarga_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-022 | `/data_pribadi/alamat/{id_sdm}` | `pegawai` | `/pegawai/{id_sdm}?tab=alamat` | `pegawai_alamat_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-023 | `/data_pribadi/kepegawaian/{id_sdm}` | `pegawai` | `/pegawai/{id_sdm}?tab=kepegawaian` | `pegawai_kepegawaian_widget` | Replika | id_sdm dari /referensi/sdm | UI sebagian ada; perlu perluasan/QA | Per scope; lihat status sinkronisasi |
| GET-024 | `/data_pribadi/lain/{id_sdm}` | `pegawai` | `/pegawai/{id_sdm}?tab=lain` | `pegawai_lain_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-025 | `/data_pribadi/bidang_ilmu/{id_sdm}` | `pegawai` | `/pegawai/{id_sdm}?tab=bidang_ilmu` | `pegawai_bidang_ilmu_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-026 | `/detasering` | `detasering` | `/detasering` | `detasering_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-027 | `/detasering/{id}` | `detasering` | `/detasering/{id}` | `detasering_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-028 | `/diklat` | `diklat` | `/diklat` | `diklat_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-029 | `/diklat/{id}` | `diklat` | `/diklat/{id}` | `diklat_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-030 | `/dokumen` | `dokumen` | `/dokumen` | `dokumen_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-031 | `/dokumen/{id}` | `dokumen` | `/dokumen/{id}` | `dokumen_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-032 | `/dokumen/{id}/download` | `dokumen` | `/dokumen/{id}` | `dokumen_download_widget` | File live | id dokumen dari metadata/relasi induk | Tautan explorer ada; halaman dokumen direncanakan | Per scope; lihat status sinkronisasi |
| GET-033 | `/inpassing` | `inpassing` | `/inpassing` | `inpassing_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-034 | `/inpassing/{id}` | `inpassing` | `/inpassing/{id}` | `inpassing_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-035 | `/jabatan_fungsional` | `jabatan_fungsional` | `/jabatan_fungsional` | `jabatan_fungsional_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-036 | `/jabatan_fungsional/{id}` | `jabatan_fungsional` | `/jabatan_fungsional/{id}` | `jabatan_fungsional_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-037 | `/jabatan_fungsional/ajuan` | `jabatan_fungsional` | `/jabatan_fungsional/ajuan` | `jabatan_fungsional_ajuan_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-038 | `/jabatan_fungsional/ajuan/{id}` | `jabatan_fungsional` | `/jabatan_fungsional/ajuan/{id}` | `jabatan_fungsional_ajuan_detail_widget` | Replika | id dari list ajuan | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-039 | `/jabatan_struktural` | `jabatan_struktural` | `/jabatan_struktural` | `jabatan_struktural_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-040 | `/jabatan_struktural/{id}` | `jabatan_struktural` | `/jabatan_struktural/{id}` | `jabatan_struktural_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-041 | `/kekayaan_intelektual` | `kekayaan_intelektual` | `/kekayaan_intelektual` | `kekayaan_intelektual_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-042 | `/kekayaan_intelektual/{id}` | `kekayaan_intelektual` | `/kekayaan_intelektual/{id}` | `kekayaan_intelektual_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-043 | `/kekayaan_intelektual/{id}/bidang_ilmu` | `kekayaan_intelektual` | `/kekayaan_intelektual/{id}?tab=bidang_ilmu` | `kekayaan_intelektual_bidang_ilmu_widget` | Replika | id dari list/detail induk | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-044 | `/kelas_kuliah/{id_kls}/dokumen` | `kelas_kuliah` | `/kelas_kuliah/{id_kls}/dokumen` | `kelas_kuliah_dokumen_widget` | Replika | id_kls = id_kelas dari pengajaran detail; cek id_pt terhadap profil_pt | Explorer; UI khusus direncanakan | 74 scope 403 lintas PT (riwayat) |
| GET-045 | `/kepangkatan` | `kepangkatan` | `/kepangkatan` | `kepangkatan_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-046 | `/kepangkatan/{id}` | `kepangkatan` | `/kepangkatan/{id}` | `kepangkatan_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-047 | `/kesejahteraan` | `kesejahteraan` | `/kesejahteraan` | `kesejahteraan_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-048 | `/kesejahteraan/{id}` | `kesejahteraan` | `/kesejahteraan/{id}` | `kesejahteraan_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-049 | `/kolaborator_eksternal` | `kolaborator_eksternal` | `/kolaborator_eksternal` | `kolaborator_eksternal_table_widget` | Pencarian live | nama atau nik | Form/detail explorer ada; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-050 | `/kolaborator_eksternal/{id}` | `kolaborator_eksternal` | `/kolaborator_eksternal/{id}` | `kolaborator_eksternal_detail_widget` | Pencarian live | id dari hasil pencarian kolaborator | Form/detail explorer ada; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-051 | `/orasi_ilmiah` | `orasi_ilmiah` | `/orasi_ilmiah` | `orasi_ilmiah_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-052 | `/orasi_ilmiah/{id}` | `orasi_ilmiah` | `/orasi_ilmiah/{id}` | `orasi_ilmiah_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-053 | `/pembicara` | `pembicara` | `/pembicara` | `pembicara_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-054 | `/pembicara/{id}` | `pembicara` | `/pembicara/{id}` | `pembicara_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-055 | `/pendidikan_formal` | `pendidikan_formal` | `/pendidikan_formal` | `pendidikan_formal_table_widget` | Replika | id_sdm dari /referensi/sdm | UI khusus ada; migrasi replika/QA tersisa | Per scope; lihat status sinkronisasi |
| GET-056 | `/pendidikan_formal/{id}` | `pendidikan_formal` | `/pendidikan_formal/{id}` | `pendidikan_formal_detail_widget` | Replika | id dari list modul | UI khusus ada; migrasi replika/QA tersisa | Per scope; lihat status sinkronisasi |
| GET-057 | `/pendidikan_formal/ajuan` | `pendidikan_formal` | `/pendidikan_formal/ajuan` | `pendidikan_formal_ajuan_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-058 | `/pendidikan_formal/ajuan/{id}` | `pendidikan_formal` | `/pendidikan_formal/ajuan/{id}` | `pendidikan_formal_ajuan_detail_widget` | Replika | id dari list ajuan | Explorer; UI khusus direncanakan | 9 scope 500 |
| GET-059 | `/penelitian` | `penelitian` | `/penelitian` | `penelitian_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-060 | `/penelitian/{id}` | `penelitian` | `/penelitian/{id}` | `penelitian_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-061 | `/penelitian/{id}/bidang_ilmu` | `penelitian` | `/penelitian/{id}?tab=bidang_ilmu` | `penelitian_bidang_ilmu_widget` | Replika | id dari list/detail induk | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-062 | `/pengabdian` | `pengabdian` | `/pengabdian` | `pengabdian_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-063 | `/pengabdian/{id}` | `pengabdian` | `/pengabdian/{id}` | `pengabdian_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-064 | `/pengabdian/{id}/bidang_ilmu` | `pengabdian` | `/pengabdian/{id}?tab=bidang_ilmu` | `pengabdian_bidang_ilmu_widget` | Replika | id dari list/detail induk | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-065 | `/pengajaran` | `pengajaran` | `/pengajaran` | `pengajaran_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-066 | `/pengajaran/{id}` | `pengajaran` | `/pengajaran/{id}` | `pengajaran_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-067 | `/pengajaran/{id}/bidang_ilmu` | `pengajaran` | `/pengajaran/{id}?tab=bidang_ilmu` | `pengajaran_bidang_ilmu_widget` | Replika | id dari list/detail induk | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-068 | `/pengelola_jurnal` | `pengelola_jurnal` | `/pengelola_jurnal` | `pengelola_jurnal_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-069 | `/pengelola_jurnal/{id}` | `pengelola_jurnal` | `/pengelola_jurnal/{id}` | `pengelola_jurnal_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-070 | `/penghargaan` | `penghargaan` | `/penghargaan` | `penghargaan_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-071 | `/penghargaan/{id}` | `penghargaan` | `/penghargaan/{id}` | `penghargaan_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-072 | `/pengujian_mahasiswa` | `pengujian_mahasiswa` | `/pengujian_mahasiswa` | `pengujian_mahasiswa_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-073 | `/pengujian_mahasiswa/{id}` | `pengujian_mahasiswa` | `/pengujian_mahasiswa/{id}` | `pengujian_mahasiswa_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-074 | `/pengujian_mahasiswa/{id}/bidang_ilmu` | `pengujian_mahasiswa` | `/pengujian_mahasiswa/{id}?tab=bidang_ilmu` | `pengujian_mahasiswa_bidang_ilmu_widget` | Replika | id dari list/detail induk | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-075 | `/penugasan` | `penugasan` | `/penugasan` | `penugasan_table_widget` | Replika | id_sdm dari /referensi/sdm | UI khusus ada; migrasi replika/QA tersisa | Per scope; lihat status sinkronisasi |
| GET-076 | `/penugasan/{id}` | `penugasan` | `/penugasan/{id}` | `penugasan_detail_widget` | Replika | id dari list modul | UI khusus ada; migrasi replika/QA tersisa | Per scope; lihat status sinkronisasi |
| GET-077 | `/penunjang_lain` | `penunjang_lain` | `/penunjang_lain` | `penunjang_lain_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-078 | `/penunjang_lain/{id}` | `penunjang_lain` | `/penunjang_lain/{id}` | `penunjang_lain_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-079 | `/publikasi` | `publikasi` | `/publikasi` | `publikasi_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-080 | `/publikasi/{id}` | `publikasi` | `/publikasi/{id}` | `publikasi_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-081 | `/publikasi/{id}/bidang_ilmu` | `publikasi` | `/publikasi/{id}?tab=bidang_ilmu` | `publikasi_bidang_ilmu_widget` | Replika | id dari list/detail induk | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-082 | `/referensi/kategori_capaian_luaran` | `referensi` | `/referensi/kategori_capaian_luaran` | `referensi_kategori_capaian_luaran_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-083 | `/referensi/perguruan_tinggi` | `referensi` | `/referensi/perguruan_tinggi` | `referensi_perguruan_tinggi_widget` | Replika | Tanpa parameter wajib | UI sebagian ada di /referensi; QA tersisa | Per scope; lihat status sinkronisasi |
| GET-084 | `/referensi/unit_kerja` | `referensi` | `/referensi/unit_kerja` | `referensi_unit_kerja_widget` | Replika | id_perguruan_tinggi dari profil_pt | UI sebagian ada di /referensi; QA tersisa | Per scope; lihat status sinkronisasi |
| GET-085 | `/referensi/detail_unit_kerja` | `referensi` | `/referensi/unit_kerja/{id_unit_kerja}` | `referensi_detail_unit_kerja_widget` | Replika | id_unit_kerja dari daftar unit | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-086 | `/referensi/mahasiswa_pddikti` | `referensi` | `/referensi/mahasiswa` | `mahasiswa_search_widget` | Pencarian live | Prodi PT sendiri + keyword; PT dari profil_pt | Form live explorer ada; UI khusus direncanakan | Sandbox pernah mengembalikan {} |
| GET-087 | `/referensi/agama` | `referensi` | `/referensi/agama` | `referensi_agama_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-088 | `/referensi/bidang_studi` | `referensi` | `/referensi/bidang_studi` | `referensi_bidang_studi_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-089 | `/referensi/bidang_usaha` | `referensi` | `/referensi/bidang_usaha` | `referensi_bidang_usaha_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-090 | `/referensi/dudi` | `referensi` | `/referensi/dudi` | `referensi_dudi_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-091 | `/referensi/gelar_akademik` | `referensi` | `/referensi/gelar_akademik` | `referensi_gelar_akademik_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-092 | `/referensi/golongan_pangkat` | `referensi` | `/referensi/golongan_pangkat` | `referensi_golongan_pangkat_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-093 | `/referensi/ikatan_kerja` | `referensi` | `/referensi/ikatan_kerja` | `referensi_ikatan_kerja_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-094 | `/referensi/jenis_dokumen` | `referensi` | `/referensi/jenis_dokumen` | `referensi_jenis_dokumen_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-095 | `/referensi/jabatan_fungsional` | `referensi` | `/referensi/jabatan_fungsional` | `referensi_jabatan_fungsional_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-096 | `/referensi/jabatan_negara` | `referensi` | `/referensi/jabatan_negara` | `referensi_jabatan_negara_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-097 | `/referensi/jabatan_tugas_tambahan` | `referensi` | `/referensi/jabatan_tugas_tambahan` | `referensi_jabatan_tugas_tambahan_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-098 | `/referensi/jenis_bahan_ajar` | `referensi` | `/referensi/jenis_bahan_ajar` | `referensi_jenis_bahan_ajar_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | 500 pada scope tertentu |
| GET-099 | `/referensi/jenis_penghargaan` | `referensi` | `/referensi/jenis_penghargaan` | `referensi_jenis_penghargaan_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-100 | `/referensi/jenis_kepanitiaan` | `referensi` | `/referensi/jenis_kepanitiaan` | `referensi_jenis_kepanitiaan_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-101 | `/referensi/jenis_kesejahteraan` | `referensi` | `/referensi/jenis_kesejahteraan` | `referensi_jenis_kesejahteraan_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-102 | `/referensi/jenis_beasiswa` | `referensi` | `/referensi/jenis_beasiswa` | `referensi_jenis_beasiswa_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-103 | `/referensi/jenis_diklat` | `referensi` | `/referensi/jenis_diklat` | `referensi_jenis_diklat_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-104 | `/referensi/jenis_keluar` | `referensi` | `/referensi/jenis_keluar` | `referensi_jenis_keluar_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-105 | `/referensi/jenis_pekerjaan` | `referensi` | `/referensi/jenis_pekerjaan` | `referensi_jenis_pekerjaan_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-106 | `/referensi/jenis_publikasi` | `referensi` | `/referensi/jenis_publikasi` | `referensi_jenis_publikasi_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-107 | `/referensi/jenis_tes` | `referensi` | `/referensi/jenis_tes` | `referensi_jenis_tes_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-108 | `/referensi/jenis_tunjangan` | `referensi` | `/referensi/jenis_tunjangan` | `referensi_jenis_tunjangan_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-109 | `/referensi/jenjang_pendidikan` | `referensi` | `/referensi/jenjang_pendidikan` | `referensi_jenjang_pendidikan_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-110 | `/referensi/profil_pt` | `referensi` | `/referensi/profil_pt` | `referensi_profil_pt_widget` | Replika | Tanpa parameter wajib | UI sebagian ada di /referensi; QA tersisa | Per scope; lihat status sinkronisasi |
| GET-111 | `/referensi/status_kepegawaian` | `referensi` | `/referensi/status_kepegawaian` | `referensi_status_kepegawaian_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-112 | `/referensi/skim_kegiatan` | `referensi` | `/referensi/skim_kegiatan` | `referensi_skim_kegiatan_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-113 | `/referensi/tingkat_penghargaan` | `referensi` | `/referensi/tingkat_penghargaan` | `referensi_tingkat_penghargaan_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-114 | `/referensi/media_publikasi` | `referensi` | `/referensi/media_publikasi` | `referensi_media_publikasi_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | 500 pada scope tertentu |
| GET-115 | `/referensi/negara` | `referensi` | `/referensi/negara` | `referensi_negara_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-116 | `/referensi/kategori_kegiatan` | `referensi` | `/referensi/kategori_kegiatan` | `referensi_kategori_kegiatan_widget` | Replika | tipe=list | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-117 | `/referensi/kelompok_bidang` | `referensi` | `/referensi/kelompok_bidang` | `referensi_kelompok_bidang_widget` | Replika | iptek true/false | Explorer; UI khusus direncanakan | 500 pada scope tertentu |
| GET-118 | `/referensi/lembaga_sertifikasi` | `referensi` | `/referensi/lembaga_sertifikasi` | `referensi_lembaga_sertifikasi_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | 500 pada scope tertentu |
| GET-119 | `/referensi/wilayah` | `referensi` | `/referensi/wilayah` | `referensi_wilayah_widget` | Replika | id_level_wilayah 0–3; relasi id_induk_wilayah | UI sebagian ada di /referensi; QA tersisa | Per scope; lihat status sinkronisasi |
| GET-120 | `/referensi/sdm` | `pegawai` | `/pegawai` | `pegawai_results_table` | Replika | Pencarian/filter lokal | UI khusus ada; migrasi replika/QA tersisa | Per scope; lihat status sinkronisasi |
| GET-121 | `/referensi/semester` | `referensi` | `/referensi/semester` | `referensi_semester_widget` | Replika | Tanpa parameter wajib | UI sebagian ada di /referensi; QA tersisa | 500 pada scope tertentu |
| GET-122 | `/referensi/sumber_gaji` | `referensi` | `/referensi/sumber_gaji` | `referensi_sumber_gaji_widget` | Replika | Tanpa parameter wajib | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-123 | `/riwayat_pekerjaan` | `riwayat_pekerjaan` | `/riwayat_pekerjaan` | `riwayat_pekerjaan_table_widget` | Replika | id_sdm dari /referensi/sdm | UI khusus ada; migrasi replika/QA tersisa | Per scope; lihat status sinkronisasi |
| GET-124 | `/riwayat_pekerjaan/{id}` | `riwayat_pekerjaan` | `/riwayat_pekerjaan/{id}` | `riwayat_pekerjaan_detail_widget` | Replika | id dari list modul | UI khusus ada; migrasi replika/QA tersisa | Per scope; lihat status sinkronisasi |
| GET-125 | `/sertifikasi_dosen` | `sertifikasi_dosen` | `/sertifikasi_dosen` | `sertifikasi_dosen_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-126 | `/sertifikasi_dosen/{id}` | `sertifikasi_dosen` | `/sertifikasi_dosen/{id}` | `sertifikasi_dosen_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-127 | `/sertifikasi_dosen/ajuan` | `sertifikasi_dosen` | `/sertifikasi_dosen/ajuan` | `sertifikasi_dosen_ajuan_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-128 | `/sertifikasi_dosen/ajuan/{id}` | `sertifikasi_dosen` | `/sertifikasi_dosen/ajuan/{id}` | `sertifikasi_dosen_ajuan_detail_widget` | Replika | id dari list ajuan | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-129 | `/sertifikasi_profesi` | `sertifikasi_profesi` | `/sertifikasi_profesi` | `sertifikasi_profesi_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-130 | `/sertifikasi_profesi/{id}` | `sertifikasi_profesi` | `/sertifikasi_profesi/{id}` | `sertifikasi_profesi_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-131 | `/nilai_tes` | `nilai_tes` | `/nilai_tes` | `nilai_tes_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-132 | `/nilai_tes/{id}` | `nilai_tes` | `/nilai_tes/{id}` | `nilai_tes_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | 404 pernah teramati |
| GET-133 | `/nilai_tes/ajuan` | `nilai_tes` | `/nilai_tes/ajuan` | `nilai_tes_ajuan_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-134 | `/nilai_tes/ajuan/{id}` | `nilai_tes` | `/nilai_tes/ajuan/{id}` | `nilai_tes_ajuan_detail_widget` | Replika | id dari list ajuan | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-135 | `/tugas_tambahan` | `tugas_tambahan` | `/tugas_tambahan` | `tugas_tambahan_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-136 | `/tugas_tambahan/{id}` | `tugas_tambahan` | `/tugas_tambahan/{id}` | `tugas_tambahan_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-137 | `/tunjangan` | `tunjangan` | `/tunjangan` | `tunjangan_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-138 | `/tunjangan/{id}` | `tunjangan` | `/tunjangan/{id}` | `tunjangan_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-139 | `/visiting_scientist` | `visiting_scientist` | `/visiting_scientist` | `visiting_scientist_table_widget` | Replika | id_sdm dari /referensi/sdm | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |
| GET-140 | `/visiting_scientist/{id}` | `visiting_scientist` | `/visiting_scientist/{id}` | `visiting_scientist_detail_widget` | Replika | id dari list modul | Explorer; UI khusus direncanakan | Per scope; lihat status sinkronisasi |

## Laporan managerial dan warning

Report tidak membutuhkan endpoint SISTER baru. Agregasi dibaca dari replika
dengan sumber endpoint, unit hitung, scope PT, periode dan waktu sync yang
dapat diperiksa. Setiap angka/grafik harus bisa membuka daftar yang
mendasarinya. Jangan menghitung list dan detail sebagai dua aktivitas, atau
menggandakan kegiatan yang sama karena muncul pada beberapa SDM. Bedakan
jumlah kegiatan unik dan jumlah partisipasi SDM; identitas lintas SDM harus
diverifikasi sebelum deduplikasi.

| Target | Sumber | Tampilan dan acceptance |
|---|---|---|
| `/laporan?jenis=sdm` | referensi/sdm, profil dan kepegawaian | Jumlah SDM dan komposisi status → daftar SDM dengan filter identik |
| `/laporan?jenis=bkd` | laporan akhir BKD dan lima aktivitas | Per semester: simpulan SISTER dan angka terdokumentasi → daftar/detail; tanpa mencipta ambang kelulusan |
| `/laporan?jenis=luaran` | penelitian, publikasi, pengabdian, KI | Tren periode/kategori → kegiatan sumber; hanya field tanggal/kategori yang tersedia |
| Ringkasan modul lainnya | List/detail modul pada matriks | Jumlah record, distribusi kategori/periode bila didukung → daftar; tidak wajib chart untuk semua modul |
| `/peringatan?jenis=data` | sister_replica_scope dan sister_sync_run | Gagal, belum sync, parsial, stale; tautan modul dan scope terkait |
| `/peringatan?jenis=bkd` | Simpulan laporan akhir BKD | Status bermasalah yang secara eksplisit dinyatakan SISTER, beserta sumber dan semester |

Warning keterlambatan ajuan, masa berlaku sertifikat, kenaikan pangkat, dan
kelengkapan wajib **belum menjadi rule aktif**. Membutuhkan field tanggal/status
yang terbukti dan definisi/ambang yang disetujui. Setiap rule menyatakan sumber,
kondisi, severity, cakupan, freshness, alasan, dan link bukti. Jika sumber gagal
atau belum sync, hasil evaluasi “Belum dapat dinilai”, bukan pelanggaran SDM.
Ambang stale berasal dari kebijakan interval sync yang ditetapkan; tampilkan
umur data bila ambang belum ada.

## State, kelengkapan dan penerimaan UI

| Kondisi | Perilaku wajib |
|---|---|
| Loading | Skeleton/state; action tidak berulang |
| Sukses berisi data | List/detail bisnis, waktu pengambilan, cakupan filter |
| Sukses kosong | “Belum ada data” hanya bila scope terkonfirmasi berhasil |
| Belum pernah sync | “Belum tersinkron”; tidak menghitung sebagai nol untuk report |
| 401/session habis | Alur login lokal; error integrasi dijelaskan tanpa token |
| 403 | Akses dibatasi; lintas PT diberi alasan bila kepemilikan terbukti |
| 404 detail sementara list ada | “Detail tidak tersedia di SISTER”; pertahankan konteks list |
| 429 | Status menunggu/coba lagi sesuai batas, tanpa retry storm |
| 500/network | Data belum dapat diperbarui; data lama dengan label stale jika ada |
| Partial/truncated | Batas dan jumlah yang diketahui terlihat; agregasi tidak dari cuplikan |
| Data sudah dihapus dari sumber | Tidak muncul sebagai aktif; deep link memberi unavailable |
| Referensi gagal/ID tak dikenal | Tampilkan ID bila aman dan label belum tersedia; jangan menebak label |

Setiap GET-ID dinyatakan UI selesai setelah ada:

1. Menu/tab/link yang bisa dijangkau dari alur admin dan route yang tahan refresh.
2. DTO/kolom/label/format yang sesuai response; seluruh field relevan serta
   nested data dapat ditelusuri melalui widget, bukan hanya raw JSON.
3. Sumber lokal/live yang jelas, scope PT, dependensi ID dan timestamp benar.
4. Permission server termasuk PII dan file; denial tidak bocor lintas scope.
5. Filter/search/pagination lengkap tanpa truncation diam-diam.
6. State sukses, kosong, gagal, forbidden, belum sync, stale dan partial diuji
   sesuai endpoint; fixture test bukan bukti keberhasilan live.
7. QA browser desktop/mobile, light/dark, keyboard, deep link/back.
8. Checklist TODO dan evidence route/widget/test diperbarui per modul.

Ketentuan visual mengikuti [design-system.md](./design-system.md): inset
horizontal halaman dan header 30px; breadcrumb di body maksimal tiga level;
action/filter di kanan breadcrumb; tanpa title/deskripsi visual berulang,
form-card, atau card bersarang. Tema hijau, ApexCharts, token tunggal.

## Urutan implementasi

Paket task pada [todo.md](./todo.md) menjadi urutan kerja: fondasi UI dan
status data → SDM/kepegawaian → pendidikan/kompetensi → pengajaran/BKD →
penelitian/publikasi → pengabdian/penunjang → kesejahteraan/dokumen →
referensi/pencarian → laporan/warning → QA lintas 140 endpoint.
Setiap paket merupakan task utuh dengan commit tersendiri; pemetaan dokumen
tidak mencentang paket implementasi.
