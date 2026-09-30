# Panduan cookbook

Scope aktif Sisterbridge: report dan warning untuk admin PT, seluruh 140 GET
dalam 39 judul modul PDF. Dokumen merupakan spesifikasi; status UI tidak
otomatis selesai ketika endpoint atau view sudah tersedia.

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
