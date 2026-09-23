# SISTER 01 — Akses, Anggota Profesi, BKD, Bahan Ajar, dan Beasiswa

Dokumen ini adalah bagian pertama dari katalog 39 modul pada `SISTER Web
Service PT.pdf` versi API 1.0.0. Nomor halaman di bawah mengikuti nomor halaman
yang tercetak pada PDF, bukan nomor halaman viewer.

## Cara membaca katalog

- **PDF** adalah lokasi indeks/detail kontrak pada dokumen resmi yang tersedia di
  repository.
- **Endpoint** adalah inventory path dan method dari indeks PDF. Detail field,
  required marker, panjang string, dan response error tetap harus dibaca dari
  halaman modul sebelum implementasi.
- **Status repository** menunjukkan coverage project saat ini, bukan status
  ketersediaan endpoint pada SISTER.
- `implemented-read-only` berarti endpoint GET yang disetujui sudah memiliki
  boundary aplikasi; itu belum berarti workflow write sudah dibuka.

## Ringkasan

| No | Modul | PDF | Jumlah endpoint | Status repository |
|---:|---|---:|---:|---|
| 1 | Akses | 11 | 1 | foundation only |
| 2 | Anggota Profesi | 12–18 | 5 | planned |
| 3 | BKD | 19–26 | 6 | implemented-read-only |
| 4 | Bahan Ajar | 27–34 | 5 | planned |
| 5 | Beasiswa | 35–40 | 5 | planned |

## 1. Akses

**Tujuan:** memperoleh JWT untuk seluruh request Web Service PT.

- **PDF:** halaman 11.
- **Endpoint:** `POST /authorize`.
- **Request:** JSON berisi `username`, `password`, dan `id_pengguna`; ketiganya
  wajib menurut PDF.
- **Response sukses:** `token` dan `role`.
- **Response penting:** `401` untuk credential salah/expired dan `500` untuk
  error server.
- **Aturan keamanan:** token berlaku 60 menit, dikirim sebagai
  `Authorization: Bearer <token>`, dan hanya boleh diproses di server. Password,
  token, dan detail error tidak boleh masuk browser, URL, log biasa, atau DTO.
- **Dependency:** keputusan auth lokal, secret manager, instance PT, dan
  verifikasi arti `id_pengguna`.
- **Status repository:** `foundation only`. Context/policy transport sudah ada,
  tetapi credential UAT dan live authorize belum tersedia.

## 2. Anggota Profesi

**Tujuan:** mengelola keanggotaan SDM pada organisasi/asosiasi profesi.

- **PDF:** halaman 12–18.
- **Endpoint:**

  - `GET /anggota_profesi`
  - `POST /anggota_profesi`
  - `GET /anggota_profesi/{id}`
  - `PUT /anggota_profesi/{id}`
  - `DELETE /anggota_profesi/{id}`

- **Pola:** CRUD per `id_sdm`, dengan detail yang memuat identitas organisasi,
  peran, tanggal keanggotaan, instansi profesi, kategori kegiatan, dan dokumen.
- **Dependency:** `/referensi/kategori_kegiatan`, `/dokumen`, dan selector SDM.
- **Security:** PUT/DELETE harus memeriksa role WS, kepemilikan `id_sdm`,
  integrasi PT, full payload PUT, dan audit `sister_operation`.
- **Status repository:** `planned`; belum ada adapter, schema runtime, atau UI.

## 3. BKD

**Tujuan:** membaca beban kerja dosen dan laporan akhir BKD.

- **PDF:** halaman 19–26.
- **Endpoint:**

  - `GET /bkd/laporan_akhir_bkd`
  - `GET /bkd/pendidikan`
  - `GET /bkd/ajar`
  - `GET /bkd/tunjang`
  - `GET /bkd/pengmas`
  - `GET /bkd/penelitian`

- **Pola:** seluruh endpoint read-only; laporan akhir memakai `id_sdm`, lima
  laporan aktivitas memakai `id_sdm` dan `id_smt`.
- **Response utama:** laporan akhir berisi agregat SKS/status; aktivitas berisi
  SDM, semester, unsur, judul kegiatan, kategori, beban SKS, dan nilai BKD.
- **Dependency:** `/referensi/sdm` dan `/referensi/semester`.
- **UI yang disepakati:** filter SDM/semester, tabs aktivitas, state loading,
  empty, error, source, dan lazy query.
- **Status repository:** `implemented-read-only`; enam GET sudah memiliki
  schema, fixture, adapter, service, protected tRPC, route `/bkd`, dan tests.

## 4. Bahan Ajar

**Tujuan:** mengelola data bahan ajar milik SDM.

- **PDF:** halaman 27–34.
- **Endpoint:**

  - `GET /bahan_ajar`
  - `POST /bahan_ajar`
  - `GET /bahan_ajar/{id}`
  - `PUT /bahan_ajar/{id}`
  - `DELETE /bahan_ajar/{id}`

- **Pola:** CRUD; list dikaitkan dengan SDM, detail menjadi sumber fetch sebelum
  update, dan dokumen bila response/request mendukungnya.
- **Dependency:** `/referensi/jenis_bahan_ajar`, `/dokumen`, dan `/referensi/sdm`.
- **Security:** jangan membuka POST/PUT/DELETE hanya karena endpoint tercantum;
  konfirmasi role WS-BASIC/WS-PRO, full payload, status `409`, dan aturan
  dokumen melalui UAT.
- **Status repository:** `planned`; detail field belum dipindahkan ke schema
  runtime karena belum menjadi scope MVP.

## 5. Beasiswa

**Tujuan:** mengelola data beasiswa yang terkait dengan SDM.

- **PDF:** halaman 35–40.
- **Endpoint:**

  - `GET /beasiswa`
  - `POST /beasiswa`
  - `GET /beasiswa/{id}`
  - `PUT /beasiswa/{id}`
  - `DELETE /beasiswa/{id}`

- **Pola:** CRUD; implementasi harus memisahkan data utama dari dokumen
  pendukung dan referensi jenis beasiswa.
- **Dependency:** `/referensi/jenis_beasiswa`, `/dokumen`, dan selector SDM.
- **Security:** validasi tanggal/nilai/field wajib dari PDF, authorization
  per-integration, audit mutation, dan no automatic retry untuk mutation.
- **Status repository:** `planned`; belum ada adapter atau page.

## Checklist sebelum salah satu modul dibuka

- [ ] Ambil schema request/response dari halaman PDF modul, bukan menebak dari
  nama endpoint.
- [ ] Konfirmasi YAML/API aktual dan perbedaan response dengan PDF.
- [ ] Pisahkan GET read-only dari workflow mutation.
- [ ] Petakan referensi dan dokumen sebagai dependency eksplisit.
- [ ] Tambahkan test schema, adapter, service, router, dan authorization sesuai
  level implementasi.

