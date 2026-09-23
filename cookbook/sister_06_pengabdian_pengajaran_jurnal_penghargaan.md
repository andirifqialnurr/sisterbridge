# SISTER 06 — Pengabdian, Pengajaran, Pengelola Jurnal, dan Penghargaan

Bagian keenam katalog 39 modul dari `SISTER Web Service PT.pdf` versi API
1.0.0.

## Ringkasan

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

