# SISTER 02 — Bimbingan, Data Pokok, Detasering, dan Diklat

Bagian kedua katalog 39 modul `SISTER Web Service PT.pdf` versi API 1.0.0.

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
| UI-06 Bimbingan Dosen | `bimbing_dosen` | 2 | Daftar/detail pembimbingan dosen dan pihak terkait | GET-000 s.d. GET-000 |
| UI-07 Bimbingan Mahasiswa | `bimbingan_mahasiswa` | 3 | Daftar/detail bimbingan; mahasiswa, dosen, dan bidang ilmu | GET-000 s.d. GET-000 |
| UI-08 Data Pokok | `pegawai` | 8 | Profil SDM dengan foto dan tujuh bagian data pokok; bagian sensitif dibatasi | GET-000 s.d. GET-000 |
| UI-09 Detasering | `detasering` | 2 | Riwayat penempatan detasering, instansi dan periode | GET-000 s.d. GET-000 |
| UI-10 Diklat | `diklat` | 2 | Daftar pelatihan, jenis, penyelenggara, periode dan dokumen | GET-000 s.d. GET-000 |

Setiap modul perlu list/detail atau konteks induk yang sesuai, field berlabel,
widget nested/dokumen bila ada, filter yang didukung data, permission server,
waktu pengambilan dan state sukses/kosong/belum sync/gagal/stale/partial.
Tidak menciptakan field atau aturan warning dari nama modul. File/pencarian
yang live mengikuti peta; default JSON bisnis dari replika lokal.

## Ringkasan (inventory PDF dan snapshot awal)

| No | Modul | PDF | Jumlah endpoint | Status repository |
|---:|---|---:|---:|---|
| 6 | Bimbingan Dosen | 41–43 | 2 | planned |
| 7 | Bimbingan Mahasiswa | 44–48 | 4 | planned |
| 8 | Data Pokok | 49–61 | 13 | partial-read-only |
| 9 | Detasering | 62–68 | 5 | planned |
| 10 | Diklat | 69–76 | 5 | planned |

## 6. Bimbingan Dosen

**Tujuan:** membaca data bimbingan dosen.

- **PDF:** halaman 41–43.
- **Endpoint:** `GET /bimbing_dosen`, `GET /bimbing_dosen/{id}`.
- **Pola:** read-only list/detail; tidak ada POST, PUT, atau DELETE pada indeks
  PDF.
- **Dependency:** SDM dan referensi mahasiswa bila field response merujuk data
  akademik.
- **Status repository:** `planned`; belum dibuat adapter atau UI.

## 7. Bimbingan Mahasiswa

**Tujuan:** membaca bimbingan mahasiswa dan mengelola nested bidang ilmu.

- **PDF:** halaman 44–48.
- **Endpoint:**

  - `GET /bimbingan_mahasiswa`
  - `GET /bimbingan_mahasiswa/{id}`
  - `GET /bimbingan_mahasiswa/{id}/bidang_ilmu`
  - `PUT /bimbingan_mahasiswa/{id}/bidang_ilmu`

- **Pola:** resource utama read-only; subresource `bidang_ilmu` mempunyai GET
  dan PUT.
- **Risiko kontrak:** PDF menyebut sumber data PDDIKTI/read-only pada domain
  tertentu, namun juga mendokumentasikan PUT nested. Status write wajib
  dikonfirmasi pada YAML/UAT sebelum coding.
- **Dependency:** `/referensi/mahasiswa_pddikti`, `/referensi/bidang_studi`
  atau referensi bidang ilmu yang dinyatakan pada detail kontrak.
- **Status repository:** `planned`; termasuk gate khusus nested `bidang_ilmu`.

## 8. Data Pokok

**Tujuan:** membaca dan, pada beberapa resource, mengubah data pokok SDM.

- **PDF:** halaman 49–61.
- **Endpoint:**

  - `GET /data_pribadi/foto/{id_sdm}`
  - `POST /data_pribadi/foto/{id_sdm}`
  - `GET /data_pribadi/profil/{id_sdm}`
  - `GET /data_pribadi/kependudukan/{id_sdm}`
  - `GET /data_pribadi/keluarga/{id_sdm}`
  - `PUT /data_pribadi/keluarga/{id_sdm}`
  - `GET /data_pribadi/alamat/{id_sdm}`
  - `PUT /data_pribadi/alamat/{id_sdm}`
  - `GET /data_pribadi/kepegawaian/{id_sdm}`
  - `GET /data_pribadi/lain/{id_sdm}`
  - `PUT /data_pribadi/lain/{id_sdm}`
  - `GET /data_pribadi/bidang_ilmu/{id_sdm}`
  - `PUT /data_pribadi/bidang_ilmu/{id_sdm}`

- **Pola:** profile, kependudukan, keluarga, alamat, kepegawaian, data lain,
  bidang ilmu, dan foto. Foto adalah binary/multipart concern; endpoint lain
  memakai JSON sesuai kontrak.
- **Data sensitif:** NIK, alamat, keluarga, foto, dan kepegawaian termasuk PII
  berisiko tinggi. DTO UI harus minimal dan log wajib di-redact.
- **Status repository:** `partial-read-only`. `GET /profil/{id_sdm}` dan
  `GET /kepegawaian/{id_sdm}` sudah dipakai oleh detail pegawai. Endpoint lain
  belum dibuka; tidak ada mutation Data Pokok pada MVP saat ini.

## 9. Detasering

**Tujuan:** mengelola penugasan detasering SDM.

- **PDF:** halaman 62–68.
- **Endpoint:** `GET /detasering`, `POST /detasering`,
  `GET /detasering/{id}`, `PUT /detasering/{id}`,
  `DELETE /detasering/{id}`.
- **Pola:** CRUD; perlu validasi periode, SDM, unit/instansi, dan dokumen jika
  tercantum pada request body PDF.
- **Dependency:** referensi unit kerja/perguruan tinggi, SDM, dan dokumen.
- **Status repository:** `planned`; belum ada adapter atau UI.

## 10. Diklat

**Tujuan:** mengelola riwayat pendidikan/pelatihan SDM.

- **PDF:** halaman 69–76.
- **Endpoint:** `GET /diklat`, `POST /diklat`, `GET /diklat/{id}`,
  `PUT /diklat/{id}`, `DELETE /diklat/{id}`.
- **Pola:** CRUD; pisahkan referensi jenis diklat dari data utama dan dokumen
  pendukung.
- **Dependency:** `/referensi/jenis_diklat`, `/dokumen`, dan SDM.
- **Status repository:** `planned`; belum ada schema runtime.

## Batas implementasi

Modul pada bagian ini menyentuh PII atau nested resource. Mulai dari GET yang
memiliki kebutuhan UI nyata; jangan membuka PUT foto, keluarga, alamat, atau
bidang ilmu sebelum authz, audit, file validation, dan UAT disepakati.
