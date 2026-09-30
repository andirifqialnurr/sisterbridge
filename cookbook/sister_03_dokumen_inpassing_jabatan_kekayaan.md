# SISTER 03 — Dokumen, Inpassing, Jabatan, dan Kekayaan Intelektual

Bagian ketiga katalog 39 modul dari `SISTER Web Service PT.pdf` versi API
1.0.0. Bagian ini memuat resource CRUD dan boundary dokumen/bidang ilmu.

## Scope UI aktif — 2026-09-30

Produk Sisterbridge adalah report/warning admin dan seluruh GET harus memiliki
tampilan bisnis. Pemetaan per endpoint, route, widget, dependency ID dan state:
[ui_endpoint_map.md](./ui_endpoint_map.md). Backlog:
[todo.md](./todo.md); requirement: [prd_managerial.md](./prd_managerial.md).

Daftar metode POST/PUT/DELETE di bawah adalah inventory PDF, bukan scope
implementasi aktif. Status repository pada katalog lama adalah snapshot awal;
status UI terkini di tabel ini dan matriks endpoint harus dibaca terpisah dari
keberhasilan live. Explorer/replika tersedia tetapi acceptance UI bisnis masih
terbuka, termasuk perluasan dan QA halaman khusus yang sudah ada.

| Acceptance | Owner folder | GET | UI bisnis yang wajib tersedia | Rujukan matriks |
|---|---|---:|---|---|
| UI-11 Dokumen | `dokumen` | 3 | Daftar metadata, detail, preview yang didukung, dan unduh | GET-000 s.d. GET-000 |
| UI-12 Inpassing | `inpassing` | 2 | Riwayat inpassing, informasi SK, tanggal dan bukti | GET-000 s.d. GET-000 |
| UI-13 Jabatan Fungsional | `jabatan_fungsional` | 4 | Riwayat jabatan dan tab ajuan terpisah dengan status dari SISTER | GET-000 s.d. GET-000 |
| UI-14 Jabatan Struktural | `jabatan_struktural` | 2 | Riwayat jabatan, unit, periode dan informasi SK | GET-000 s.d. GET-000 |
| UI-15 Kekayaan Intelektual | `kekayaan_intelektual` | 3 | Daftar karya, jenis, tahun; detail pihak terkait, dokumen dan bidang ilmu | GET-000 s.d. GET-000 |

Setiap modul perlu list/detail atau konteks induk yang sesuai, field berlabel,
widget nested/dokumen bila ada, filter yang didukung data, permission server,
waktu pengambilan dan state sukses/kosong/belum sync/gagal/stale/partial.
Tidak menciptakan field atau aturan warning dari nama modul. File/pencarian
yang live mengikuti peta; default JSON bisnis dari replika lokal.

## Ringkasan (inventory PDF dan snapshot awal)

| No | Modul | PDF | Jumlah endpoint | Status repository |
|---:|---|---:|---:|---|
| 11 | Dokumen | 77–83 | 6 | planned |
| 12 | Inpassing | 84–90 | 5 | planned |
| 13 | Jabatan Fungsional | 91–99 | 7 | planned |
| 14 | Jabatan Struktural | 100–105 | 5 | planned |
| 15 | Kekayaan Intelektual | 106–116 | 7 | planned |

## 11. Dokumen

**Tujuan:** membuat, membaca, menghapus, dan mengunduh dokumen pendukung yang
kemudian direferensikan oleh resource utama.

- **PDF:** halaman 77–83.
- **Endpoint:** `GET /dokumen`, `POST /dokumen`, `GET /dokumen/{id}`,
  `POST /dokumen/{id}`, `DELETE /dokumen/{id}`,
  `GET /dokumen/{id}/download`.
- **Pola transport:** metadata memakai JSON; upload memakai
  `multipart/form-data`; download mengembalikan binary sesuai MIME type.
- **Security wajib:** extension allowlist, MIME/content sniffing, size limit,
  filename normalization, random storage key, malware/DLP decision, ownership
  check, permission check, dan no bearer token di browser.
- **Workflow:** document ID harus dibuat lebih dahulu sebelum dikirim pada
  payload utama. Bila operasi utama gagal, document ID perlu dicatat untuk
  cleanup/reconciliation.
- **Status repository:** `planned`; file workflow belum dibuka.

## 12. Inpassing

**Tujuan:** mengelola data inpassing SDM.

- **PDF:** halaman 84–90.
- **Endpoint:** `GET /inpassing`, `POST /inpassing`, `GET /inpassing/{id}`,
  `PUT /inpassing/{id}`, `DELETE /inpassing/{id}`.
- **Pola:** CRUD dengan relasi SDM, dokumen, dan referensi yang dinyatakan pada
  schema PDF.
- **Security:** full payload PUT, authorization per PT/integration, status
  duplicate `409`, dan audit mutation.
- **Status repository:** `planned`.

## 13. Jabatan Fungsional

**Tujuan:** mengelola jabatan fungsional dan membaca ajuan terkait.

- **PDF:** halaman 91–99.
- **Endpoint:**

  - `GET /jabatan_fungsional`
  - `POST /jabatan_fungsional`
  - `GET /jabatan_fungsional/{id}`
  - `PUT /jabatan_fungsional/{id}`
  - `DELETE /jabatan_fungsional/{id}`
  - `GET /jabatan_fungsional/ajuan`
  - `GET /jabatan_fungsional/ajuan/{id}`

- **Pola:** master data CRUD dan readback ajuan; ajuan bukan sekadar status
  master data.
- **Dependency:** referensi jabatan fungsional, pangkat/golongan, dokumen, dan
  status ajuan bila tersedia.
- **Status repository:** `planned`.

## 14. Jabatan Struktural

**Tujuan:** mengelola jabatan struktural SDM.

- **PDF:** halaman 100–105.
- **Endpoint:** `GET /jabatan_struktural`, `POST /jabatan_struktural`,
  `GET /jabatan_struktural/{id}`, `PUT /jabatan_struktural/{id}`,
  `DELETE /jabatan_struktural/{id}`.
- **Pola:** CRUD; validasi tanggal/periode, unit kerja, dan dokumen mengikuti
  request body PDF.
- **Dependency:** referensi unit kerja/jabatan dan dokumen bila diminta.
- **Status repository:** `planned`.

## 15. Kekayaan Intelektual

**Tujuan:** mengelola kekayaan intelektual dan nested bidang ilmu.

- **PDF:** halaman 106–116.
- **Endpoint:**

  - `GET /kekayaan_intelektual`
  - `POST /kekayaan_intelektual`
  - `GET /kekayaan_intelektual/{id}`
  - `PUT /kekayaan_intelektual/{id}`
  - `DELETE /kekayaan_intelektual/{id}`
  - `GET /kekayaan_intelektual/{id}/bidang_ilmu`
  - `PUT /kekayaan_intelektual/{id}/bidang_ilmu`

- **Pola:** CRUD utama plus nested bidang ilmu.
- **Dependency:** dokumen, referensi bidang ilmu, kategori/jenis kekayaan
  intelektual, dan SDM.
- **Security:** nested PUT harus diperlakukan sebagai mutation terpisah,
  dengan full payload dan audit; jangan menyamakan dengan PATCH parsial.
- **Status repository:** `planned` dan menunggu keputusan nested bidang ilmu.
