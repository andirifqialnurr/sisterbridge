# SISTER 08 — Referensi, Riwayat Pekerjaan, dan Sertifikasi Dosen/Profesi

Bagian kedelapan katalog 39 modul dari `SISTER Web Service PT.pdf` versi API
1.0.0. Modul Referensi paling besar secara jumlah endpoint dan harus dipahami
sebagai dependency layer, bukan satu tabel UI raksasa.

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
| UI-32 Referensi | `referensi` | 41 | Direktori referensi berlabel, profil PT dan hierarki unit/wilayah; pencarian mahasiswa terpisah | GET-000 s.d. GET-000 |
| UI-33 Riwayat Pekerjaan | `riwayat_pekerjaan` | 2 | Riwayat pekerjaan, institusi, jabatan, periode dan dokumen | GET-000 s.d. GET-000 |
| UI-34 Sertifikasi Dosen | `sertifikasi_dosen` | 4 | Daftar/detail sertifikasi dan tab ajuan read-only | GET-000 s.d. GET-000 |
| UI-35 Sertifikasi Profesi | `sertifikasi_profesi` | 2 | Daftar/detail sertifikasi, lembaga, bidang dan bukti | GET-000 s.d. GET-000 |

Setiap modul perlu list/detail atau konteks induk yang sesuai, field berlabel,
widget nested/dokumen bila ada, filter yang didukung data, permission server,
waktu pengambilan dan state sukses/kosong/belum sync/gagal/stale/partial.
Tidak menciptakan field atau aturan warning dari nama modul. File/pencarian
yang live mengikuti peta; default JSON bisnis dari replika lokal.

## Ringkasan (inventory PDF dan snapshot awal)

| No | Modul | PDF | Jumlah endpoint | Status repository |
|---:|---|---:|---:|---|
| 32 | Referensi | 231–259 | 41 | partial-read-only |
| 33 | Riwayat Pekerjaan | 260–266 | 5 | implemented-read-only |
| 34 | Sertifikasi Dosen | 267–271 | 4 | planned |
| 35 | Sertifikasi Profesi | 272–278 | 5 | planned |

## 32. Referensi

**Tujuan:** menyediakan selector/master data untuk modul lain.

- **PDF:** halaman 231–259.
- **Pola:** seluruh endpoint pada indeks adalah `GET`; tidak ada POST, PUT, atau
  DELETE.
- **Endpoint:**

  - `GET /referensi/kategori_capaian_luaran`
  - `GET /referensi/perguruan_tinggi`
  - `GET /referensi/unit_kerja`
  - `GET /referensi/detail_unit_kerja`
  - `GET /referensi/mahasiswa_pddikti`
  - `GET /referensi/agama`
  - `GET /referensi/bidang_studi`
  - `GET /referensi/bidang_usaha`
  - `GET /referensi/dudi`
  - `GET /referensi/gelar_akademik`
  - `GET /referensi/golongan_pangkat`
  - `GET /referensi/ikatan_kerja`
  - `GET /referensi/jenis_dokumen`
  - `GET /referensi/jabatan_fungsional`
  - `GET /referensi/jabatan_negara`
  - `GET /referensi/jabatan_tugas_tambahan`
  - `GET /referensi/jenis_bahan_ajar`
  - `GET /referensi/jenis_penghargaan`
  - `GET /referensi/jenis_kepanitiaan`
  - `GET /referensi/jenis_kesejahteraan`
  - `GET /referensi/jenis_beasiswa`
  - `GET /referensi/jenis_diklat`
  - `GET /referensi/jenis_keluar`
  - `GET /referensi/jenis_pekerjaan`
  - `GET /referensi/jenis_publikasi`
  - `GET /referensi/jenis_tes`
  - `GET /referensi/jenis_tunjangan`
  - `GET /referensi/jenjang_pendidikan`
  - `GET /referensi/profil_pt`
  - `GET /referensi/status_kepegawaian`
  - `GET /referensi/skim_kegiatan`
  - `GET /referensi/tingkat_penghargaan`
  - `GET /referensi/media_publikasi`
  - `GET /referensi/negara`
  - `GET /referensi/kategori_kegiatan`
  - `GET /referensi/kelompok_bidang`
  - `GET /referensi/lembaga_sertifikasi`
  - `GET /referensi/wilayah`
  - `GET /referensi/sdm`
  - `GET /referensi/semester`
  - `GET /referensi/sumber_gaji`

- **Dependency rule:** selector hanya boleh memakai field yang ada di response
  endpoint terkait; jangan membuat local master baru tanpa kontrak SISTER.
- **Status repository:** `partial-read-only`. `/referensi/profil_pt`,
  `/referensi/semester`, dan `/referensi/sdm` sudah menjadi adapter/service/UI;
  38 endpoint referensi lainnya belum dibuka.

## 33. Riwayat Pekerjaan

**Tujuan:** membaca dan kelak mengelola riwayat pekerjaan SDM.

- **PDF:** halaman 260–266.
- **Endpoint:** `GET /riwayat_pekerjaan`, `POST /riwayat_pekerjaan`,
  `GET /riwayat_pekerjaan/{id}`, `PUT /riwayat_pekerjaan/{id}`,
  `DELETE /riwayat_pekerjaan/{id}`.
- **Pola:** CRUD; detail memuat metadata pekerjaan dan dokumen bila tersedia.
- **Dependency:** `/referensi/jenis_pekerjaan`, bidang usaha, `/dokumen`, dan
  SDM.
- **Status repository:** `implemented-read-only`. GET list/detail, fixture,
  adapter, service, protected tRPC, page, detail, dan tests sudah tersedia;
  mutation belum dibuka.

## 34. Sertifikasi Dosen

**Tujuan:** membaca sertifikasi dosen dan ajuan sertifikasi.

- **PDF:** halaman 267–271.
- **Endpoint:** `GET /sertifikasi_dosen`, `GET /sertifikasi_dosen/{id}`,
  `GET /sertifikasi_dosen/ajuan`, `GET /sertifikasi_dosen/ajuan/{id}`.
- **Pola:** read-only master/detail dan read-only ajuan.
- **Dependency:** lembaga sertifikasi, dokumen, SDM, dan status ajuan.
- **Status repository:** `planned`.

## 35. Sertifikasi Profesi

**Tujuan:** mengelola sertifikasi profesi SDM.

- **PDF:** halaman 272–278.
- **Endpoint:** `GET /sertifikasi_profesi`, `POST /sertifikasi_profesi`,
  `GET /sertifikasi_profesi/{id}`, `PUT /sertifikasi_profesi/{id}`,
  `DELETE /sertifikasi_profesi/{id}`.
- **Pola:** CRUD; pisahkan master sertifikasi dari dokumen pendukung.
- **Dependency:** `/referensi/lembaga_sertifikasi`, `/dokumen`, dan SDM.
- **Status repository:** `planned`.
