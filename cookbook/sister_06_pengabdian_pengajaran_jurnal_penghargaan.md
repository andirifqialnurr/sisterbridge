# SISTER 06 — Pengabdian, Pengajaran, Pengelola Jurnal, dan Penghargaan

Bagian keenam katalog 39 modul dari `SISTER Web Service PT.pdf` versi API
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
| UI-24 Pengabdian | `pengabdian` | 3 | Daftar pengabdian; judul, tahun, kategori; anggota, bidang ilmu dan dokumen | GET-000 s.d. GET-000 |
| UI-25 Pengajaran | `pengajaran` | 3 | Daftar pengajaran per semester, mata kuliah/kelas; detail, bidang ilmu dan dokumen kelas | GET-000 s.d. GET-000 |
| UI-26 Pengelola Jurnal | `pengelola_jurnal` | 2 | Daftar/detail jurnal, peran pengelola, periode dan bukti | GET-000 s.d. GET-000 |
| UI-27 Penghargaan | `penghargaan` | 2 | Daftar/detail penghargaan, jenis, tingkat, tahun dan dokumen | GET-000 s.d. GET-000 |

Setiap modul perlu list/detail atau konteks induk yang sesuai, field berlabel,
widget nested/dokumen bila ada, filter yang didukung data, permission server,
waktu pengambilan dan state sukses/kosong/belum sync/gagal/stale/partial.
Tidak menciptakan field atau aturan warning dari nama modul. File/pencarian
yang live mengikuti peta; default JSON bisnis dari replika lokal.

## Ringkasan (inventory PDF dan snapshot awal)

| No | Modul | PDF | Jumlah endpoint | Status repository |
|---:|---|---:|---:|---|
| 24 | Pengabdian | 174–184 | 7 | planned |
| 25 | Pengajaran | 185–189 | 4 | planned |
| 26 | Pengelola Jurnal | 190–196 | 5 | planned |
| 27 | Penghargaan | 197–203 | 5 | planned |

## 24. Pengabdian

**Tujuan:** mengelola kegiatan pengabdian dan nested bidang ilmu.

- **PDF:** halaman 174–184.
- **Endpoint:** `GET /pengabdian`, `POST /pengabdian`,
  `GET /pengabdian/{id}`, `PUT /pengabdian/{id}`,
  `DELETE /pengabdian/{id}`, `GET /pengabdian/{id}/bidang_ilmu`,
  `PUT /pengabdian/{id}/bidang_ilmu`.
- **Pola:** CRUD utama plus nested bidang ilmu.
- **Dependency:** SDM, referensi skim/kategori kegiatan, bidang ilmu, dan
  dokumen.
- **Status repository:** `planned`; nested bidang ilmu harus melalui contract
  gate sebelum write.

## 25. Pengajaran

**Tujuan:** membaca data pengajaran dan bidang ilmu terkait.

- **PDF:** halaman 185–189.
- **Endpoint:** `GET /pengajaran`, `GET /pengajaran/{id}`,
  `GET /pengajaran/{id}/bidang_ilmu`, `PUT /pengajaran/{id}/bidang_ilmu`.
- **Pola:** resource pengajaran read-only; nested bidang ilmu mempunyai PUT.
- **Dependency:** kelas kuliah, mahasiswa, bidang ilmu, dan SDM.
- **Risiko kontrak:** validasi ulang status source PDDIKTI/read-only dan otorisasi
  nested PUT pada UAT.
- **Status repository:** `planned`.

## 26. Pengelola Jurnal

**Tujuan:** mengelola peran SDM dalam pengelolaan jurnal.

- **PDF:** halaman 190–196.
- **Endpoint:** `GET /pengelola_jurnal`, `POST /pengelola_jurnal`,
  `GET /pengelola_jurnal/{id}`, `PUT /pengelola_jurnal/{id}`,
  `DELETE /pengelola_jurnal/{id}`.
- **Pola:** CRUD; detail field dan referensi jurnal wajib mengikuti PDF.
- **Dependency:** SDM, referensi kategori, dan dokumen bila tersedia.
- **Status repository:** `planned`.

## 27. Penghargaan

**Tujuan:** mengelola penghargaan SDM.

- **PDF:** halaman 197–203.
- **Endpoint:** `GET /penghargaan`, `POST /penghargaan`,
  `GET /penghargaan/{id}`, `PUT /penghargaan/{id}`,
  `DELETE /penghargaan/{id}`.
- **Pola:** CRUD; jenis dan tingkat penghargaan berasal dari endpoint Referensi.
- **Dependency:** `/referensi/jenis_penghargaan`,
  `/referensi/tingkat_penghargaan`, `/dokumen`, dan SDM.
- **Status repository:** `planned`.
