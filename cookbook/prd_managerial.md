# PRD Managerial Sisterbridge

Status: spesifikasi aktif 2026-09-30; portable base + Project Profile.
Dokumen ini menggantikan rencana release write pada PRD lama untuk scope
Sisterbridge. `prd.md` belum dapat ditulis dalam sesi ini karena izin file;
gunakan dokumen ini bersama [ui_endpoint_map.md](./ui_endpoint_map.md).

## Kontrak portable

Requirement harus dapat ditelusuri dari kebutuhan pengguna ke endpoint,
sumber data, halaman/widget, permission dan evidence. Saat dipakai di repo
lain, ganti nama produk, actor, API, field, rule dan scope. Pertahankan
pemisahan implementasi, keberhasilan live dan acceptance UI.
Keberadaan endpoint write pada external API tidak otomatis menjadi scope produk.

## Project Profile

- Produk Sisterbridge: report dan warning untuk admin satu PT.
- Source of truth: SISTER Web Service PT API 1.0.0, PDF dan response aktual.
- Seluruh 140 GET dari 39 judul modul harus memiliki UI bisnis yang jelas.
  Akses tidak mempunyai GET; `POST /authorize` hanya autentikasi server.
- 135 endpoint JSON dibaca melalui replika lokal; 2 file dan 3 pencarian/detail
  pencarian tetap live.
- Next.js/React/TypeScript, Bun, Prisma/PostgreSQL, tRPC/Zod dan ApexCharts.
- Modul di `src/modules/<module>/`; route Next.js tipis. Primitive di
  `src/component/ui/`, composite di `component/widget/` atau widget modul.
- Hijau dan font terpusat pada `src/const/theme.ts`.
- Semua tabel/kolom fisik dan view lowercase `snake_case`.

## Tujuan dan batas produk

Admin dapat membaca ringkasan, menelusuri SDM/kegiatan, membuka detail serta
bukti, dan memahami apakah data lengkap serta cukup baru untuk report.
Setiap modul mendapat halaman bisnis meskipun jumlah data saat ini kosong.
Generic explorer tetap alat diagnosis, bukan acceptance akhir UI managerial.

Scope aktif mencakup list/detail, bidang ilmu, data anak, referensi, pembacaan
ajuan, metadata/foto/unduh dokumen, report, warning, status sync dan audit.

Tidak ada create/update/delete data SISTER, upload/attach file atau submit/
approve ajuan. Login lokal, sync dan audit tetap menulis metadata aplikasi.
Tidak ada scraping, direct database SISTER, master bisnis pengganti SISTER
atau aturan penilaian yang dibuat tanpa field/definisi terverifikasi.

## Actor dan source of truth

ADMIN adalah pengguna utama. OPERATOR/REVIEWER/VIEWER tetap role lokal yang
ada; akses setiap modul/field perlu ditetapkan server-side. Default halaman
sensitif baru ADMIN. Hak lokal tidak memperluas hak akun PT SISTER.

| Data | Sumber target |
|---|---|
| SDM, BKD, aktivitas, referensi, metadata dan ajuan | JSONB/view replika → DTO terkurasi |
| Foto dan file | Route handler server live saat diminta |
| Kolaborator dan mahasiswa berbasis keyword | Form pencarian → server → SISTER |
| User, permission, audit, sync | Prisma/database aplikasi |
| Report/warning | Turunan sumber di atas dengan scope, periode, rule dan evidence |

Seluruh query dan file wajib memeriksa session, role, integration/PT dan
relasi resource. UI menampilkan sumber/freshness; secret dan payload pribadi
lengkap tidak dikirim hanya untuk disembunyikan di browser.

## Functional requirements dan acceptance

| ID | Kebutuhan | Acceptance |
|---|---|---|
| FR-01 | Navigasi seluruh modul | Semua GET-ID pada matriks mempunyai menu/tab/link; URL menjaga filter/tab/pagination dan back/refresh; tidak ada menu dummy |
| FR-02 | List/detail bisnis | Kolom terkurasi, field berlabel, tanggal/angka terformat; ID bukan pengganti label yang tersedia; null bukan nol |
| FR-03 | SDM lengkap | Daftar SDM dan tujuh bagian data pokok + foto; bagian sensitif dibatasi; tab aktivitas menggunakan owner widget |
| FR-04 | BKD | Laporan akhir + lima tab aktivitas dari replika; id_smt dari laporan akhir bila referensi gagal; simpulan persis sesuai sumber |
| FR-05 | Relasi/nested data | Penulis/anggota/mahasiswa/dosen/bidang ilmu/dokumen terbaca di widget; tidak hanya “[n item]” atau JSON |
| FR-06 | Referensi/pencarian | Seluruh 41 GET referensi dapat diakses; selector parent-child sah; prodi/keyword dan nama/NIK tervalidasi; live diberi label |
| FR-07 | Dokumen dan ajuan | Metadata/detail/download dalam konteks; ajuan terpisah dari master; hanya status/jenis yang tersedia, tanpa mutation |
| FR-08 | Report | Angka/grafik → daftar/detail sumber dengan filter identik; unit hitung dan deduplikasi jelas; ApexCharts + padanan tabel |
| FR-09 | Warning | Sumber/kondisi/severity/alasan/cakupan/freshness/link bukti jelas; data gagal/belum sync menjadi belum dapat dinilai |
| FR-10 | Status data | Loading, kosong sukses, belum sync, stale, partial, 403, 404 dan 500 berbeda; riwayat lintas PT dijelaskan |
| FR-11 | Keamanan | Role + integration/PT + relasi pada server termasuk agregasi/file; DTO allowlist; audit redacted |
| FR-12 | Data lengkap di UI | Pagination lokal server-side, total tidak dari cuplikan; batas upstream tidak boleh disajikan sebagai data utuh |

Detail per modul, dependency ID, route, widget dan runtime exception:
[ui_endpoint_map.md](./ui_endpoint_map.md). List/detail/child dapat berada dalam
satu modul; tidak perlu 140 menu utama. Semua kolom/filter harus punya
padanan response PDF/live, termasuk null dan tipe aktual.

## Report dan rule warning

Prioritas report: SDM, BKD per semester, serta penelitian/publikasi/pengabdian/KI
per periode/kategori yang tersedia. Modul lain punya ringkasan sesuai field.
Pisahkan kegiatan unik dari partisipasi SDM; jangan menjumlah list + detail.

Warning awal: masalah pengambilan data, belum sync, partial, freshness dan
simpulan bermasalah yang secara eksplisit dinyatakan SISTER pada BKD.
Ambang stale mengikuti kebijakan interval sync yang ditetapkan; sementara
belum ada ambang, tampilkan umur data.

Deadline ajuan, masa berlaku sertifikat, kenaikan pangkat dan kelengkapan wajib
belum menjadi rule aktif. Butuh field yang terbukti serta definisi stakeholder.
Sumber gagal/parsial tidak boleh menghasilkan tuduhan pelanggaran SDM.

## UX dan non-functional requirements

Inset header dan halaman horizontal 30px. Header hanya search global dan
profil; breadcrumb di body maksimal tiga level; filter/search/action rata
kanan breadcrumb. Tanpa title/deskripsi visual berulang, form-card atau card
bersarang. h1 aksesibel boleh tersembunyi. Aksi baris/pagination dekat tabel.
Dropdown/date picker custom, keyboard dan focus benar, light/dark responsif.

UI utama membaca replika; jangan ada live request tersembunyi atau sync saat
membuka halaman. File/search menyatakan ketergantungan koneksi. Agregasi scope
PT dan record aktif, tidak menghitung error sebagai nol. Status sandbox jelas.
View hasil generator perlu direview/diperbarui bila sampel response berkembang.

## Tahap, evidence dan penerimaan

Tahap pengambilan GET sudah punya read path 140/140 dan full sync lokal dengan
pengecualian. UI lengkap masih pekerjaan: beberapa halaman khusus, explorer
dan dashboard tersedia, tetapi belum seluruh alur managerial lolos QA.

Per GET-ID harus ada owner, route/widget nyata, sumber, parameter sah, state,
permission dan evidence browser. Endpoint eksternal yang error boleh mempunyai
UI yang diterima untuk handling error, tetapi keberhasilan live tetap diberi
status terpisah. Tidak ada klaim semua record berhasil dari coverage kode.

Paket kerja dan checklist per modul: [todo.md](./todo.md). Validasi mencakup
kontrak/service/permission yang relevan, browser desktop/mobile/light/dark,
deep link/back serta drill-down. Seluruh keputusan rule/permission yang belum
ditetapkan ditandai, tanpa menghalangi pembangunan UI baca yang sudah jelas.
