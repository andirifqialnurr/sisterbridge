# SISTER 04 — Kelas Kuliah, Kepangkatan, Kesejahteraan, dan Kolaborator

Bagian keempat katalog 39 modul dari `SISTER Web Service PT.pdf` versi API
1.0.0.

## Ringkasan

| No | Modul | PDF | Jumlah endpoint | Status repository |
|---:|---|---:|---:|---|
| 16 | Kelas Kuliah | 117–120 | 3 | planned |
| 17 | Kepangkatan | 121–123 | 2 | planned |
| 18 | Kesejahteraan | 124–129 | 5 | planned |
| 19 | Kolaborator Eksternal | 130–136 | 5 | planned |

## 16. Kelas Kuliah

**Tujuan:** mengelola dokumen yang terkait dengan kelas kuliah.

- **PDF:** halaman 117–120.
- **Endpoint:** `GET /kelas_kuliah/{id_kls}/dokumen`,
  `POST /kelas_kuliah/{id_kls}/dokumen`,
  `DELETE /kelas_kuliah/{id_kls}/dokumen/{id_dok}`.
- **Pola:** resource kelas kuliah menjadi parent; hanya operasi dokumen yang
  tersedia pada modul ini.
- **Transport:** upload kemungkinan multipart sesuai aturan global dokumen;
  konfirmasi field/MIME dari halaman PDF sebelum implementasi.
- **Dependency:** data kelas dari PDDIKTI/SISTER dan modul Dokumen.
- **Security:** `id_kls` dan `id_dok` harus di-ownership-check; jangan menerima
  arbitrary document ID dari browser tanpa pemeriksaan relasi.
- **Status repository:** `planned`.

## 17. Kepangkatan

**Tujuan:** membaca data kepangkatan SDM.

- **PDF:** halaman 121–123.
- **Endpoint:** `GET /kepangkatan`, `GET /kepangkatan/{id}`.
- **Pola:** read-only list/detail; tidak ada mutation pada indeks PDF.
- **Dependency:** SDM, referensi pangkat/golongan, dan dokumen bila response
  menyediakan metadata dokumen.
- **Status repository:** `planned`.

## 18. Kesejahteraan

**Tujuan:** mengelola data kesejahteraan SDM.

- **PDF:** halaman 124–129.
- **Endpoint:** `GET /kesejahteraan`, `POST /kesejahteraan`,
  `GET /kesejahteraan/{id}`, `PUT /kesejahteraan/{id}`,
  `DELETE /kesejahteraan/{id}`.
- **Pola:** CRUD; jenis kesejahteraan dan dokumen harus dipisahkan dari data
  utama.
- **Dependency:** `/referensi/jenis_kesejahteraan`, `/dokumen`, dan SDM.
- **Security:** data dapat memuat informasi personal/benefit; terapkan DTO
  minimization, role check, audit, dan retention yang sesuai.
- **Status repository:** `planned`.

## 19. Kolaborator Eksternal

**Tujuan:** mengelola kolaborator eksternal yang terkait kegiatan SDM.

- **PDF:** halaman 130–136.
- **Endpoint:** `GET /kolaborator_eksternal`, `POST /kolaborator_eksternal`,
  `GET /kolaborator_eksternal/{id}`, `PUT /kolaborator_eksternal/{id}`,
  `DELETE /kolaborator_eksternal/{id}`.
- **Pola:** CRUD; field pihak eksternal, periode, kegiatan, dan dokumen harus
  mengikuti schema PDF, bukan asumsi dari nama modul.
- **Dependency:** SDM, referensi negara/DUDI bila digunakan oleh schema, dan
  dokumen.
- **Status repository:** `planned`.

## Keputusan sebelum coding

- Pastikan sumber master kelas kuliah dan kolaborator (SISTER atau PDDIKTI).
- Konfirmasi apakah document endpoint menggunakan binary yang sama dengan
  `/dokumen`.
- Tentukan retention dan minimization untuk data kesejahteraan.

