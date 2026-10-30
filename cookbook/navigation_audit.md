# Audit navigasi halaman — 2026-10-30

## Keputusan

Satu menu memilih **submenu atau tab**, tidak keduanya. Tabel data bukan tab
navigasi dan tetap dipakai pada halaman operasional. Jumlah fitur bukan satu-
satunya pertimbangan: dataset/workflow yang mandiri tetap memakai submenu,
meski hanya dua sampai lima. Tab hanya untuk view sederhana pada menu langsung
(tidak menjadi anak submenu dan tidak memiliki pemilih modul di dalamnya).

| Menu / kelompok | Pilihan | Alasan / tampilan halaman |
| --- | --- | --- |
| Data pribadi (7 bagian) | Submenu | Bagian profil cukup banyak; SDM terpilih dipertahankan. Halaman hanya menampilkan bagian aktif. |
| Kepegawaian (9) | Submenu | Riwayat dan ajuan merupakan dataset mandiri, bukan sekadar pergantian view. |
| Pendidikan dan kompetensi (9) | Submenu | Pendidikan, sertifikasi, tes dan ajuan mempunyai kebutuhan data sendiri. |
| Pengajaran dan bimbingan (6) | Submenu | Kegiatan dan relasi berbeda; detail/child menjadi section data, bukan tab. |
| Penelitian dan publikasi (5) | Submenu | Lima modul mandiri dengan parent, relasi, dan dokumen masing-masing. |
| Pengabdian dan penunjang (5) | Submenu | Lima jenis kegiatan mandiri; tidak dipaksa menjadi tab hanya karena sedikit. |
| Kesejahteraan (2) | Submenu | Kesejahteraan dan tunjangan adalah dataset berbeda, bukan dua tampilan hasil sama. |
| Dokumen dan BKD (7) | Submenu | Metadata dokumen dan enam bagian BKD; SDM/semester dipertahankan antarbagian BKD. |
| Referensi (43 varian katalog) | Submenu | Direktori besar dengan query/hierarki tersendiri, tidak cocok menjadi tab. |
| Pencarian (2) | Submenu | Form dan kebutuhan parameter pencarian berbeda. |
| Operasi (4 alat) | Submenu | Data Replika, Jelajah, Status Sinkronisasi, Audit adalah alat mandiri. Tidak ada tab di halaman anaknya. |
| Laporan | Tab saja: SDM, BKD, Luaran | Tiga view read-only laporan; tidak diulang sebagai submenu. |
| Peringatan | Tab saja: Sumber data, Simpulan BKD | Dua view read-only warning; tidak diulang sebagai submenu. |
| Ikhtisar / Pegawai / BKD / Direktori referensi / Akses pada Workspace | Link langsung / landing | Bukan grup submenu kedua. Pegawai membuka direktori; BKD membuka laporan akhir. Tidak menambahkan tab di landing/detail. |

## Temuan dan perbaikan

Perbaikan profil SDM/BKD sebelumnya belum cukup: ketika Data Replika telah
berisi hasil, komponen bersama `DataExplorerView` masih menampilkan tab Data,
Struktur data, dan JSON di bawah pemilih modul. Baseline browser produksi
mengonfirmasi satu kombinasi submenu/pemilih modul + tab pada sampel tersebut.

Tab explorer dihapus pada komponen bersama, sehingga hasil daftar dan detail
Replika/Jelajah selalu membuka data langsung. Struktur dan JSON tetap tersedia
sebagai satu disclosure native berlabel **Struktur data dan JSON**: tertutup
secara default, baru dirender ketika dibuka, bukan navigasi alternatif modul.
Tidak menambah dropdown/pseudo-tab pengganti. Pagination dan tombol detail
masih berfungsi. Role/ownership/sumber data tidak diubah.

## Bukti crawl browser

Build Next produksi lokal, akun ADMIN sementara, Chrome headless terisolasi;
lebar **1280 dan 320px**. URL menu diambil dari link sidebar yang benar-benar
terender, bukan hanya daftar route hardcoded.

- **106 target menu** pada setiap lebar, diperiksa dalam batch offset 0/53,
  masing-masing 53 target: seluruh 212 kunjungan menu lulus.
- **42 sampel populated** pada setiap lebar: tujuh bagian profil dan 35 detail
  modul. Seluruh 84 kunjungan lulus; dua modul tidak punya parent aktif dan
  tidak diklaim detailnya lulus (`bimbing_dosen`, `pengujian_mahasiswa`).
- Delapan pemeriksaan tambahan per lebar: explorer referensi Agama yang benar-
  benar berisi data, disclosure diagnostik dibuka dan JSON tersedia, serta
  seluruh tiga view Laporan dan dua view Peringatan. Seluruh 16 kunjungan lulus.
- Total **312 pemeriksaan DOM halaman/view**. Nol kombinasi submenu/pemilih
  modul dengan tab, nol overflow halaman, nol error tRPC/uncaught exception
  pada batch akhir. Tablist hanya diizinkan pada `/laporan` dan `/peringatan`,
  maksimal satu tablist dan maksimal lima tab per halaman.
- Tambahan unit explorer memeriksa data langsung, tidak ada role tab/tablist,
  raw JSON belum dirender sebelum disclosure dibuka, pagination/action tetap
  ada, serta empty/object state dan escaping.
- Quality gate: **602 test / 79 file**, typecheck, lint dan build Next langsung
  lulus. Build mencakup collect traces, tidak mengklaim wrapper Prisma generate
  berhasil pada Windows saat DLL masih dikunci proses lain.

Crawl awal terinterupsi setelah desktop; batch akhir di atas dijalankan ulang
sampai selesai. Satu akun QA terinterupsi dibersihkan sebelum batch lanjutan.
Akun/credential/session tiap batch dihapus oleh finally; verifikasi akhir nol
akun QA tersisa, port server/browser berhenti, dan profile temp dihapus. Audit
login tetap dipertahankan. Data replika dan akun existing tidak diubah.
Picker pada `/jelajah` memanggil procedure `pegawai.search` otomatis saat mount;
procedure tersebut dapat membaca direktori SDM live dan mengisi cache pegawai.
Karena batch memakai `next start` tanpa override upstream, targetnya mengikuti
`SISTER_BASE_URL` terkonfigurasi, bukan dijamin sandbox. Jangan menyatakan crawl
ini nol request upstream atau seluruh database tidak pernah ditulis.

Batas: QA navigasi/sampel, bukan semua record/role, visual manual seluruh UI,
screen reader, atau acceptance seluruh GET. Foto/file diblokir; crawl tidak
mensubmit form pencarian/list modul Jelajah atau menjalankan sync/mutation
SISTER. Direktori SDM otomatis di atas berbeda dari pengujian hasil modul.
Shared explorer Jelajah diuji lewat komponen dan hasil replika, bukan bukti
seluruh hasil modul live tersedia.

## Menjalankan ulang

Server produksi lokal dan Chrome debugging terisolasi mengikuti README.

```sh
UI_SMOKE_CREATE_TEMP_ADMIN=1 UI_SMOKE_NAVIGATION_CRAWL_ONLY=1 \
  bun scripts/browser_admin_smoke.mjs
```

Default mencakup kedua lebar dan seluruh fase. Untuk batch yang lebih singkat:

```sh
UI_SMOKE_CREATE_TEMP_ADMIN=1 UI_SMOKE_NAVIGATION_CRAWL_ONLY=1 \
  UI_SMOKE_CRAWL_WIDTH=320 UI_SMOKE_CRAWL_PHASE=menus \
  UI_SMOKE_CRAWL_OFFSET=0 UI_SMOKE_CRAWL_LIMIT=53 \
  bun scripts/browser_admin_smoke.mjs
```

Lanjutkan offset 53, ulangi pada width 1280; fase `details` dan `extras` juga
harus dijalankan pada kedua lebar untuk menyatakan crawl lengkap. Log fase
parsial bukan bukti seluruh crawl lulus. Mode baseline lama hanya untuk
reproduksi (`UI_SMOKE_CRAWL_BASELINE=1`) dan tidak mengklaim acceptance.
