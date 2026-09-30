# SISTER 07 — Pengujian Mahasiswa, Penugasan, Penunjang Lain, dan Publikasi

Bagian ketujuh katalog 39 modul dari `SISTER Web Service PT.pdf` versi API
1.0.0.

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
| UI-28 Pengujian Mahasiswa | `pengujian_mahasiswa` | 3 | Daftar/detail pengujian; mahasiswa, dosen dan bidang ilmu | GET-000 s.d. GET-000 |
| UI-29 Penugasan | `penugasan` | 2 | Daftar/detail penempatan, PT/unit dan masa penugasan | GET-000 s.d. GET-000 |
| UI-30 Penunjang Lain | `penunjang_lain` | 2 | Daftar/detail kegiatan penunjang, peran, periode dan bukti | GET-000 s.d. GET-000 |
| UI-31 Publikasi | `publikasi` | 3 | Daftar publikasi; judul, jenis, tahun; penulis, bidang ilmu dan dokumen | GET-000 s.d. GET-000 |

Setiap modul perlu list/detail atau konteks induk yang sesuai, field berlabel,
widget nested/dokumen bila ada, filter yang didukung data, permission server,
waktu pengambilan dan state sukses/kosong/belum sync/gagal/stale/partial.
Tidak menciptakan field atau aturan warning dari nama modul. File/pencarian
yang live mengikuti peta; default JSON bisnis dari replika lokal.

## Ringkasan (inventory PDF dan snapshot awal)

| No | Modul | PDF | Jumlah endpoint | Status repository |
|---:|---|---:|---:|---|
| 28 | Pengujian Mahasiswa | 204–208 | 4 | planned |
| 29 | Penugasan | 209–211 | 2 | implemented-read-only |
| 30 | Penunjang Lain | 212–218 | 5 | planned |
| 31 | Publikasi | 219–230 | 7 | planned |

## 28. Pengujian Mahasiswa

**Tujuan:** membaca data pengujian mahasiswa dan bidang ilmu terkait.

- **PDF:** halaman 204–208.
- **Endpoint:** `GET /pengujian_mahasiswa`,
  `GET /pengujian_mahasiswa/{id}`,
  `GET /pengujian_mahasiswa/{id}/bidang_ilmu`,
  `PUT /pengujian_mahasiswa/{id}/bidang_ilmu`.
- **Pola:** resource utama read-only dengan nested bidang ilmu yang dapat
  memiliki PUT.
- **Dependency:** mahasiswa PDDIKTI, bidang ilmu, kelas/kegiatan, dan SDM.
- **Status repository:** `planned`; nested PUT menunggu keputusan kontrak dan
  UAT.

## 29. Penugasan

**Tujuan:** membaca penugasan SDM.

- **PDF:** halaman 209–211.
- **Endpoint:** `GET /penugasan`, `GET /penugasan/{id}`.
- **Pola:** read-only list/detail dengan query `id_sdm` pada list.
- **Dependency:** `/referensi/sdm` dan referensi unit kerja/status bila muncul
  pada response.
- **UI yang disepakati:** selector SDM, URL detail langsung, state loading,
  empty, error, unauthorized, not found, dan source.
- **Status repository:** `implemented-read-only`; schema, fixture, adapter,
  service, protected tRPC, page/list-detail, dan tests sudah tersedia.

## 30. Penunjang Lain

**Tujuan:** mengelola aktivitas penunjang lain milik SDM.

- **PDF:** halaman 212–218.
- **Endpoint:** `GET /penunjang_lain`, `POST /penunjang_lain`,
  `GET /penunjang_lain/{id}`, `PUT /penunjang_lain/{id}`,
  `DELETE /penunjang_lain/{id}`.
- **Pola:** CRUD; kemungkinan memakai kategori kegiatan, dokumen, dan periode
  yang harus dipetakan dari field PDF.
- **Dependency:** `/referensi/kategori_kegiatan`, `/dokumen`, dan SDM.
- **Status repository:** `planned`.

## 31. Publikasi

**Tujuan:** mengelola publikasi SDM dan nested bidang ilmu.

- **PDF:** halaman 219–230.
- **Endpoint:**

  - `GET /publikasi`
  - `POST /publikasi`
  - `GET /publikasi/{id}`
  - `PUT /publikasi/{id}`
  - `DELETE /publikasi/{id}`
  - `GET /publikasi/{id}/bidang_ilmu`
  - `PUT /publikasi/{id}/bidang_ilmu`

- **Pola:** CRUD utama plus nested bidang ilmu.
- **Dependency:** `/referensi/jenis_publikasi`, media publikasi, bidang ilmu,
  `/dokumen`, dan SDM.
- **Status repository:** `planned`; jangan membuka chart/analytics sebelum
  response agregat yang dibutuhkan benar-benar tersedia.
