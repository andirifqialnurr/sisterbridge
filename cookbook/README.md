# Panduan cookbook

Scope aktif Sisterbridge: report dan warning untuk admin PT, seluruh 140 GET
dalam 39 judul modul PDF. Dokumen merupakan spesifikasi; status UI tidak
otomatis selesai ketika endpoint atau view sudah tersedia.

## Audit progres terbaru

Baca [audit GET, menu, pagination dan UI 2026-10-26](./progress_audit.md)
sebelum melanjutkan implementasi. Audit membedakan bukti database/live,
masalah route dan view lokal, serta celah pagination dan QA yang belum selesai.
Temuan audit bukan klaim bahwa perbaikannya sudah diterapkan.

## Smoke test browser lokal

Script tanpa dependency tambahan: `scripts/browser_ui_smoke.mjs` (Node 22+).
Jalankan dev server terpisah dengan `SISTER_FIXTURE_MODE=true`, tanpa mengedit
`.env`, lalu Chrome headless dengan `--remote-debugging-port=9333` dan
`--user-data-dir=<direktori-temp-terisolasi>`. Jangan memakai profil browser
pribadi atau mengekspos debugging port ke jaringan.

```sh
UI_SMOKE_BASE_URL=http://localhost:2700 node scripts/browser_ui_smoke.mjs
```

Butuh replika lokal dengan SDM dan referensi DUDI besar. Script memeriksa
pagination hingga halaman terakhir, lebar 1280/1024/390/320, light/dark,
sidebar mobile/keyboard dan picker; output hanya struktur/assertion.
Ini fixture OPERATOR, bukan acceptance seluruh UI ADMIN atau GET upstream.
Hentikan server dan browser uji setelah selesai, lalu hapus hanya direktori
profile temp QA yang dibuat untuk run tersebut. Browser dapat menyimpan cache
atau cookie pada profile-nya meskipun script tidak menulisnya ke file. Jangan
menyentuh profile browser pribadi.

Untuk boundary produksi tanpa login, jalankan build lalu server `next start`
lokal pada port terpisah:

```sh
bun run build
# Terminal terpisah: bun run start -- --port 2703
UI_SMOKE_BASE_URL=http://localhost:2703 node scripts/production_boundary_smoke.mjs
```

Memeriksa CSP produksi (tanpa unsafe-eval), HSTS/header, redirect halaman,
dan penolakan file tanpa sesi/cookie invalid. Bukan QA authenticated ADMIN.
Pada Windows jalankan build/Prisma generate setelah proses uji database dan
dev server berhenti agar engine Prisma tidak terkunci (EPERM).

## QA browser ADMIN dan sesi nyata (opt-in)

`scripts/browser_admin_smoke.mjs` membutuhkan build produksi, database lokal
tersinkron dan Chrome debugging pada profil temp terisolasi seperti di atas.
Jalankan server dengan origin lokal yang konsisten (jangan edit `.env`):

```sh
APP_URL=http://localhost:2703 APP_ALLOWED_ORIGINS=http://localhost:2703 bun run start -- --port 2703
# Terminal lain; opt-in eksplisit karena script membuat akun QA lokal sementara:
UI_SMOKE_CREATE_TEMP_ADMIN=1 bun scripts/browser_admin_smoke.mjs
```

Script membuat akun unik, login normal, menyimpan password/cookie hanya di
memori, lalu menghapus user/account/session dalam `finally`. Akun existing
tidak diubah; event audit tetap disimpan. File/foto upstream diblokir pada
browser. Jangan gunakan DB production atau profile Chrome pribadi. Bila proses
harus dimatikan paksa, periksa dan hapus akun `ui-qa-…@example.invalid` milik
run tersebut beserta sesi/credential-nya; jangan menghapus event audit.

Cakupan: 101 target menu desktop + 320px, empat Ajuan deep link, pagination
DUDI/warning hingga akhir, Back/Forward, role sesi nyata pada API representatif
dan penolakan akun nonaktif. Tidak mencetak isi tabel atau data personal;
bukan acceptance semua detail/child/file, screen reader atau visual manual.

Tambahan detail (satu sample parent aktif per modul, bukan seluruh record):

```sh
UI_SMOKE_CREATE_TEMP_ADMIN=1 UI_SMOKE_DETAILS_ONLY=1 bun scripts/browser_admin_smoke.mjs
# Fokus hanya pada child-section pagination + dashboard:
UI_SMOKE_CREATE_TEMP_ADMIN=1 UI_SMOKE_CHILD_PAGES_ONLY=1 bun scripts/browser_admin_smoke.mjs
```

Suite lengkap sekarang juga mencakup detail sample, section anggota/dokumen
independen dan dashboard yang harus benar-benar berisi agregat (bukan sekadar
HTTP 200). Navigasi diberi jeda 2,5 detik untuk menghormati rate limit API;
suite lengkap bisa memerlukan lebih dari 10 menit. Rate limit aplikasi tidak
dinaikkan. Detail-only memerlukan sekitar 3–4 menit pada dataset lokal ini.
Modul parent kosong ditandai untested; child-pagination memerlukan sample
pengabdian dengan lebih dari 20 anggota dan dokumen, atau dilaporkan skipped.

## QA file/tenant lokal (opt-in)

`scripts/file_boundary_smoke.mjs` membutuhkan server build lokal dengan origin
login yang sama seperti QA ADMIN. Script membuat akun QA, integrasi saudara
**disabled** dengan record sintetis, dan record QA soft-deleted pada integrasi
aktif. Seluruh data QA dihapus di `finally`; akun/record existing tidak diubah,
audit dipertahankan. Jangan menjalankan terhadap database production.

```sh
UI_SMOKE_CREATE_TEMP_ADMIN=1 bun scripts/file_boundary_smoke.mjs
```

Default menguji penolakan role/tenant/soft-delete dan ownership attachment/kelas
pada PostgreSQL. Fixture relasi dibuat dalam transaksi yang sengaja rollback,
termasuk foreign integration/PT, scope tidak konsisten, profil PT ambigu,
serta metadata multi-owner active/retired dan index owner pada tenant lain;
record existing tidak dimodifikasi. Jalur Dokumen memakai satu query EXISTS
sehingga tidak bergantung pada owner pertama atau urutan record. Default tidak mengunduh file.
Untuk empat sample binary live, **jalankan server lokal dengan `SISTER_BASE_URL`
di-override ke URL sandbox dari `SISTER_BASE_URL_DEV`**. `next start` memakai
NODE_ENV production sehingga tanpa override ini ia memilih URL upstream
production. Jangan hanya mengandalkan env CLI probe untuk memilih target server.
Setelah memastikan target server benar:

```sh
UI_SMOKE_CREATE_TEMP_ADMIN=1 FILE_SMOKE_ALLOW_LIVE=1 bun scripts/file_boundary_smoke.mjs
```

Satu foto, dokumen metadata, attachment aktivitas dan dokumen kelas yang punya
bukti ownership dipilih dari cache; binary hanya dibaca ke memori. Output hanya
source/kind/status/MIME/jumlah byte atau kode error upstream. Nama file, ID,
cookie/password dan isi file tidak dicetak atau disimpan. Checkpoint terkini:
foto, dokumen metadata dan attachment aktivitas HTTP 200; sample kelas mendapat
HTTP 400 upstream (gateway 502), jadi live probe **exit 1 / partial**. Ini bukan
alasan bypass otorisasi, mengikuti URL arbitrary atau menganggap semua dokumen
kelas tidak tersedia; hanya satu sample binary kelas diperiksa. Bila proses dimatikan paksa, bersihkan data QA
milik run (`credential_ref=temporary-file-qa`, scope `file-qa-…`, akun `ui-qa-…`)
beserta sesi/credential-nya; jangan menghapus audit.

## QA feedback unduhan (tanpa binary upstream)

```sh
UI_SMOKE_CREATE_TEMP_ADMIN=1 UI_SMOKE_DOWNLOADS_ONLY=1 bun scripts/browser_admin_smoke.mjs
```

Memerlukan server build lokal dan Chrome profile QA terisolasi seperti mode
ADMIN lainnya. Pada detail Dokumen, mode ini mengubah hanya role akun QA untuk
mendapat penolakan server nyata, memeriksa alert inline + relasi aria-describedby,
retry dengan jaringan diblokir pada 320px, busy/disabled, lalu membatalkan request
yang ditahan CDP melalui unmount saat navigasi SPA. Tidak memalsukan auth response,
tidak mengambil screenshot payload, dan download browser disetel deny agar tidak
ada file tersimpan. Tidak memanggil binary upstream. Akun QA dibersihkan; audit
dipertahankan. Save-dialog/sukses download native bukan bagian mode ini.

## Probe pencarian sandbox

```sh
bun scripts/sister_search_probe.ts
# Kriteria nama kolaborator opsional via env SISTER_QA_COLLABORATOR_NAME;
# jangan gunakan NIK untuk smoke test atau mencetak kriteria/payload.
```

Script menolak mode fixture/target non-sandbox, membaca prodi PT sendiri,
memeriksa penolakan prodi asing sebelum endpoint mahasiswa, dan mengikuti
maksimal satu detail dari hasil pencarian kolaborator (tanpa mengarang ID).
Default keyword QA bisa menghasilkan empty/no-match; detail tanpa parent
akan dilaporkan waiting, bukan sukses. Status/sample count saja dicetak;
tidak menulis database/file atau mencetak search term/ID/data personal.
Setiap request diberi jeda 1 detik dan timeout 10 detik.

Untuk QA selector program studi dengan sesi nyata, gunakan server lokal dan
Chrome terisolasi seperti QA ADMIN, lalu:

```sh
UI_SMOKE_CREATE_TEMP_ADMIN=1 UI_SMOKE_PROGRAMS_ONLY=1 bun scripts/browser_admin_smoke.mjs
```

Memeriksa option prodi terfilter, layout 1280/320px dan role ADMIN-only dengan
akun QA sementara. Tidak mengirim keyword mahasiswa dari browser.

## Screenshot visual referensi (akun QA sementara)

Dengan server build lokal dan Chrome profile terisolasi yang sama:

```sh
UI_SMOKE_CREATE_TEMP_ADMIN=1 UI_SMOKE_VISUAL_ONLY=1 bun scripts/browser_admin_smoke.mjs
```

Memeriksa header search pegawai, active sidebar terlihat, drawer/fokus, lalu
menyimpan enam PNG `sister-visual-*.png` di temp OS: referensi agama light/dark,
1280/320px dan sidebar mobile terbuka. Hanya gunakan halaman non-personal ini;
identitas akun QA sintetis bisa terlihat, bukan akun existing. Tidak memuat
binary upstream. Screenshot harus diperiksa secara visual; capture sukses atau
assertion overflow bukan pengganti review gambar/screen reader seluruh UI.

## Keyboard BKD (sesi ADMIN nyata)

```sh
UI_SMOKE_CREATE_TEMP_ADMIN=1 UI_SMOKE_TABS_ONLY=1 bun scripts/browser_admin_smoke.mjs
```

Menggunakan server build lokal + Chrome terisolasi yang sama. Memeriksa
ArrowLeft/Right/Home/End pada tab BKD di 320px, fokus/selection, dan sample
cached SDM tanpa semester untuk memastikan activity tab disabled dilewati.
Jika tidak ada sample tanpa semester, output menyatakan sample unavailable;
bukan bukti state tersebut lulus. Akun QA dibersihkan, audit dipertahankan.
Unit test arah skip-disabled dan markup ARIA ada pada `component/ui/`.

## Pagination riwayat/status sync

```sh
UI_SMOKE_CREATE_TEMP_ADMIN=1 UI_SMOKE_STATUS_ONLY=1 bun scripts/browser_admin_smoke.mjs
```

Dengan server build lokal + Chrome terisolasi, menguji page run dan kelompok
status secara independen, Back/Forward/deep link, ukuran baris, URL page invalid
serta permission sesi nyata. Dataset perlu >10 run dan >10 kelompok non-200
agar dua pager dapat diuji; pada checkpoint ini ada 13 run dan 14 kelompok.
Tidak membuat data sync palsu. Akun QA dibersihkan dan audit dipertahankan.
Status page kini membaca seluruh riwayat secara paginated, bukan fixed 20/50.

## Logout dan isolasi cache antar akun (SPA)

```sh
UI_SMOKE_CREATE_TEMP_ADMIN=1 bun scripts/browser_session_smoke.mjs
```

Butuh server build lokal/origin konsisten dan Chrome profile temp pada port
9333 seperti mode ADMIN. Script membuat dua akun QA, prime referensi non-personal,
logout ADMIN lalu login VIEWER melalui form dalam dokumen browser yang sama,
sebelum cache 60 detik kedaluwarsa. Memeriksa denial tanpa baris/header control
lama, Back, header HTTP private/no-store, password form kosong setelah logout,
network failure recovery, serta login dark 320px. Tidak memuat file upstream.

Akun, hash password dan sesi dihapus di `finally`; password/cookie hanya di
memori dan audit dipertahankan. Jangan menjalankan terhadap database production.
Pemeriksaan ini bukan revocation lintas semua tab/perangkat atau screen reader
lengkap. Session cache identity bukan pengganti authorization server.

## Logout lintas tab dan expiry idle (QA opt-in)

```sh
UI_SMOKE_CREATE_TEMP_ADMIN=1 bun scripts/browser_expiry_smoke.mjs
```

Memerlukan server build lokal dan Chrome profile terisolasi yang sama. Script
membuat satu akun QA, menguji broadcast logout ke tab kedua tanpa reload/focus,
kemudian memperpendek **hanya session QA** ke enam detik untuk memeriksa cache
expiry saat idle. CDP menambahkan opsi builtin `disableRefresh` pada request
get-session QA, tanpa memalsukan response, agar deadline test tidak diperpanjang.
Sesi biasa/global/existing tidak diubah. Akun/credential/session QA dibersihkan;
audit tetap disimpan. Jangan menjalankan terhadap database production.

Pemeriksaan terbatas pada Chrome lokal, bukan revocation lintas semua device
atau jaminan timer tepat waktu saat browser frozen/offline/clock skew. Server
selalu menegakkan authorization. Helper CDP bersama: `scripts/lib/browser_cdp.mjs`.

## Konsistensi report dan drill-down

```sh
bun scripts/report_consistency.ts
# Dengan server build lokal dan Chrome profile terisolasi:
UI_SMOKE_CREATE_TEMP_ADMIN=1 UI_SMOKE_REPORTS_ONLY=1 bun scripts/browser_admin_smoke.mjs
```

Audit DB hanya baca, tanpa request upstream: membandingkan setiap group agregat
dengan count/filter serta first/last page, key unik dan membership owner sample.
Tidak mencetak ID, nama atau payload personal. Pada checkpoint ini: 64 group,
85 halaman sample, 40 group luaran shared, nol issue. Bukan audit semua record
atau seluruh halaman tengah.

Mode browser memerlukan kelompok luaran shared >50 record dan group BKD yang
berisi data. Memeriksa label judul/owner, link source, count/pagination terakhir,
Back/deep link, chart table vs API, semester BKD dan lebar 320px. Tidak mengambil
screenshot data personal atau mengunduh file upstream. Akun QA dibersihkan dan
audit dipertahankan; jangan gunakan DB production.

## Urutan baca untuk developer/AI

1. [PRD managerial aktif](./prd_managerial.md): tujuan produk dan acceptance.
2. [Peta UI endpoint](./ui_endpoint_map.md): 39 modul dan 140 baris GET dengan
   route, widget, owner, dependensi, sumber target dan kondisi awal.
3. [TODO](./todo.md): paket kerja dan checklist acceptance 39 modul.
4. [Architecture](./architecture.md), [schema](./schema.md) dan
   [design system](./design-system.md): boundary, data dan tampilan.
5. [Security](./security.md) + [kontrol UI](./security_ui.md).
6. [Replika](./sister_replica.md), [schema hasil generator](./replica_schema.md),
   serta sembilan dokumen `sister_01`–`sister_09` sesuai modul yang dikerjakan.

Paket UI mengikuti sumber GET yang sudah ada. Jangan mengerjakan CRUD, upload,
submit/approve atau write ke SISTER dari checklist lama. Riwayat checkpoint
dipertahankan sebagai evidence waktu itu; bagian scope aktif mengunggulinya.

## Kendala file dan patch siap diterapkan

Pada sesi dokumentasi 2026-09-30, `prd.md` dan `security.md` dapat dibaca
tetapi overwrite ditolak izin file Windows. File lain berhasil diperbarui.
PRD aktif tersedia sebagai `prd_managerial.md`; tambahan kontrol tersedia
sebagai `security_ui.md`. Jangan memakai scope write dalam PRD lama.

[pending_document_updates.patch](./pending_document_updates.patch) berisi
penggantian PRD lama serta pembaruan scope security. Setelah pemilik workspace
memulihkan izin tulis kedua file, jalankan dari root repository:

```sh
git apply --check cookbook/pending_document_updates.patch
git apply cookbook/pending_document_updates.patch
```

Patch belum diterapkan; periksa ulang bila kedua file telah berubah.
Validasi 2026-09-30: `git apply --check` lulus, tanpa menulis kedua file.
Setelah diterapkan, tutup DOC-ACCESS pada TODO, perbarui catatan kendala ini
dan dua dokumen pendamping. Jangan menyatakan patch sudah diterapkan hanya
karena file patch ada.

## Adaptasi ke project lain

Pemeriksaan dokumentasi sesi ini: 140 path unik pada matriks cocok dengan
inventaris kode (tidak ada kurang/tambahan), komposisi sumber 135/2/3,
39 checklist acceptance modul, dan tautan relatif valid. `git diff --check`
lulus. Ini validasi dokumentasi, bukan uji browser atau klaim UI baru selesai.

Pertahankan pola kebutuhan → sumber data → halaman/widget → permission →
evidence dan pemisahan status implementasi/live/UI. Ganti seluruh Project
Profile, endpoint, role, field, rule, route dan kebijakan data.
Template write hanya digunakan bila scope produk tujuan memang memerlukannya.
Dokumen generated tidak diedit manual; generate/review di repository tujuan.
