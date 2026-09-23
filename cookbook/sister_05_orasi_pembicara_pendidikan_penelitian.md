# SISTER 05 — Orasi Ilmiah, Pembicara, Pendidikan Formal, dan Penelitian

Bagian kelima katalog 39 modul dari `SISTER Web Service PT.pdf` versi API
1.0.0.

## Ringkasan

| No | Modul | PDF | Jumlah endpoint | Status repository |
|---:|---|---:|---:|---|
| 20 | Orasi Ilmiah | 137–144 | 5 | planned |
| 21 | Pembicara | 145–152 | 5 | planned |
| 22 | Pendidikan Formal | 153–162 | 7 | implemented-read-only |
| 23 | Penelitian | 163–173 | 7 | planned |

## 20. Orasi Ilmiah

**Tujuan:** mengelola rekam orasi ilmiah SDM.

- **PDF:** halaman 137–144.
- **Endpoint:** `GET /orasi_ilmiah`, `POST /orasi_ilmiah`,
  `GET /orasi_ilmiah/{id}`, `PUT /orasi_ilmiah/{id}`,
  `DELETE /orasi_ilmiah/{id}`.
- **Pola:** CRUD; body detail, tanggal, penyelenggara, dan dokumen harus diambil
  dari halaman PDF.
- **Dependency:** SDM dan Dokumen.
- **Status repository:** `planned`.

## 21. Pembicara

**Tujuan:** mengelola kegiatan sebagai pembicara.

- **PDF:** halaman 145–152.
- **Endpoint:** `GET /pembicara`, `POST /pembicara`, `GET /pembicara/{id}`,
  `PUT /pembicara/{id}`, `DELETE /pembicara/{id}`.
- **Pola:** CRUD; perhatikan field kegiatan, penyelenggara, waktu, peran, dan
  dokumen sebagaimana kontrak resmi.
- **Dependency:** SDM, referensi kategori/tingkat kegiatan bila diminta, dan
  Dokumen.
- **Status repository:** `planned`.

## 22. Pendidikan Formal

**Tujuan:** membaca dan kelak mengelola riwayat pendidikan formal SDM serta
ajuan pendidikan.

- **PDF:** halaman 153–162.
- **Endpoint:**

  - `GET /pendidikan_formal`
  - `POST /pendidikan_formal`
  - `GET /pendidikan_formal/{id}`
  - `PUT /pendidikan_formal/{id}`
  - `DELETE /pendidikan_formal/{id}`
  - `GET /pendidikan_formal/ajuan`
  - `GET /pendidikan_formal/ajuan/{id}`

- **Pola:** list/detail master, CRUD, serta read-only ajuan pada indeks PDF.
- **Dependency:** `/referensi/jenjang_pendidikan`, gelar, negara/wilayah,
  `/dokumen`, dan SDM.
- **Status repository:** `implemented-read-only`. List/detail, fixture, schema,
  adapter, service, protected tRPC, route, dan tests sudah ada. POST/PUT/DELETE
  serta ajuan belum dibuka.

## 23. Penelitian

**Tujuan:** mengelola penelitian SDM dan nested bidang ilmu.

- **PDF:** halaman 163–173.
- **Endpoint:**

  - `GET /penelitian`
  - `POST /penelitian`
  - `GET /penelitian/{id}`
  - `PUT /penelitian/{id}`
  - `DELETE /penelitian/{id}`
  - `GET /penelitian/{id}/bidang_ilmu`
  - `PUT /penelitian/{id}/bidang_ilmu`

- **Pola:** CRUD utama plus nested bidang ilmu.
- **Dependency:** Dokumen, referensi skim/kategori kegiatan, bidang ilmu, dan
  SDM.
- **Security:** mutation utama dan nested mutation diaudit sebagai operasi
  berbeda; full payload PUT wajib mengikuti YAML/response aktual.
- **Status repository:** `planned`; termasuk domain yang membutuhkan keputusan
  khusus untuk bidang ilmu.

