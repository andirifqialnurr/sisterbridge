# SISTER 09 — Tes, Tugas Tambahan, Tunjangan, dan Visiting Scientist

Bagian kesembilan dan terakhir katalog 39 modul dari `SISTER Web Service PT.pdf`
versi API 1.0.0.

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
| UI-36 Tes | `nilai_tes` | 4 | Daftar/detail hasil tes dan tab ajuan; detail 404 dibedakan dari list kosong | GET-000 s.d. GET-000 |
| UI-37 Tugas Tambahan | `tugas_tambahan` | 2 | Daftar/detail tugas, jabatan, periode dan dokumen | GET-000 s.d. GET-000 |
| UI-38 Tunjangan | `tunjangan` | 2 | Daftar/detail tunjangan per SDM; nilai/nominal hanya jika tersedia dan diizinkan | GET-000 s.d. GET-000 |
| UI-39 Visiting Scientist | `visiting_scientist` | 2 | Riwayat kegiatan, institusi tujuan, periode dan dokumen | GET-000 s.d. GET-000 |

Setiap modul perlu list/detail atau konteks induk yang sesuai, field berlabel,
widget nested/dokumen bila ada, filter yang didukung data, permission server,
waktu pengambilan dan state sukses/kosong/belum sync/gagal/stale/partial.
Tidak menciptakan field atau aturan warning dari nama modul. File/pencarian
yang live mengikuti peta; default JSON bisnis dari replika lokal.

## Ringkasan (inventory PDF dan snapshot awal)

| No | Modul | PDF | Jumlah endpoint | Status repository |
|---:|---|---:|---:|---|
| 36 | Tes | 279–287 | 7 | planned |
| 37 | Tugas Tambahan | 288–294 | 5 | planned |
| 38 | Tunjangan | 295–300 | 5 | planned |
| 39 | Visiting Scientist | 301–307 | 5 | planned |

## 36. Tes

**Tujuan:** membaca nilai tes dan mengelola ajuan nilai tes.

- **PDF:** halaman 279–287.
- **Endpoint:**

  - `GET /nilai_tes`
  - `GET /nilai_tes/{id}`
  - `GET /nilai_tes/ajuan`
  - `POST /nilai_tes/ajuan`
  - `GET /nilai_tes/ajuan/{id}`
  - `PUT /nilai_tes/ajuan/{id}`
  - `DELETE /nilai_tes/ajuan/{id}`

- **Pola:** master nilai read-only; workflow ajuan memiliki create/detail/update/
  delete.
- **Dependency:** `/referensi/jenis_tes`, SDM, dokumen bila diminta, dan model
  status ajuan.
- **Security:** mutation ajuan harus memetakan role WS-BASIC/WS-PRO, status
  duplicate, outcome tidak pasti, audit, dan re-fetch setelah berhasil.
- **Status repository:** `planned`.

## 37. Tugas Tambahan

**Tujuan:** mengelola tugas tambahan SDM.

- **PDF:** halaman 288–294.
- **Endpoint:** `GET /tugas_tambahan`, `POST /tugas_tambahan`,
  `GET /tugas_tambahan/{id}`, `PUT /tugas_tambahan/{id}`,
  `DELETE /tugas_tambahan/{id}`.
- **Pola:** CRUD; detail field, periode, jabatan, unit, dan dokumen mengikuti
  schema PDF.
- **Dependency:** referensi jabatan tugas tambahan, unit kerja, SDM, dan
  dokumen.
- **Status repository:** `planned`.

## 38. Tunjangan

**Tujuan:** mengelola tunjangan SDM.

- **PDF:** halaman 295–300.
- **Endpoint:** `GET /tunjangan`, `POST /tunjangan`, `GET /tunjangan/{id}`,
  `PUT /tunjangan/{id}`, `DELETE /tunjangan/{id}`.
- **Pola:** CRUD; validasi periode, jenis, nilai, dan dokumen harus memakai
  aturan resmi, bukan validasi UI semata.
- **Dependency:** `/referensi/jenis_tunjangan`, sumber gaji, SDM, dan dokumen.
- **Security:** data finansial/benefit wajib DTO minimization, role boundary,
  audit mutation, retention, dan restricted readback.
- **Status repository:** `planned`.

## 39. Visiting Scientist

**Tujuan:** mengelola aktivitas visiting scientist.

- **PDF:** halaman 301–307.
- **Endpoint:** `GET /visiting_scientist`, `POST /visiting_scientist`,
  `GET /visiting_scientist/{id}`, `PUT /visiting_scientist/{id}`,
  `DELETE /visiting_scientist/{id}`.
- **Pola:** CRUD; periode, institusi asal/tujuan, aktivitas, dan dokumen harus
  dipetakan dari body resmi.
- **Dependency:** perguruan tinggi/negara/wilayah, SDM, dan dokumen.
- **Status repository:** `planned`.

## Gate release untuk modul 36–39

- [ ] Konfirmasi aturan mutation/ajuan dan role credential pada UAT.
- [ ] Konfirmasi field finansial dan retention sebelum Tunjangan dibuka.
- [ ] Pastikan external institution tidak menjadi arbitrary free-text bila PDF
      menyediakan referensi.
- [ ] Sediakan `NEEDS_REVIEW` untuk timeout atau hasil mutation yang tidak pasti.
