# SISTER 07 — Pengujian Mahasiswa, Penugasan, Penunjang Lain, dan Publikasi

Bagian ketujuh katalog 39 modul dari `SISTER Web Service PT.pdf` versi API
1.0.0.

## Ringkasan

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

