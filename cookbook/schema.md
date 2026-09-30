# Portable Data Schema dan Kontrak External API

Status dokumen: portable base + project profile

Dokumen ini mendefinisikan batas source of truth, kontrak external API, dan
schema persistence lokal. Bagian yang menyebut SISTER adalah profile untuk
repository `sister-integrated`; saat dipindahkan ke project lain, ganti profile
tersebut dengan external system dan domain project tujuan.

Security schema, klasifikasi data, dan audit event dirinci pada
[security.md](./security.md). Dokumen ini menjelaskan bentuk data yang harus
disimpan; `security.md` menjelaskan alasan security, akses, retention, dan
evidence auditnya.

## Project Profile: `sister-integrated`

- External API: SISTER Web Service PT API Reference versi 1.0.0.
- Sumber kontrak: [SISTER Web Service PT.pdf](../SISTER%20Web%20Service%20PT.pdf).
- Inventory: 236 endpoint unik dalam 39 domain.
- Local database: PostgreSQL dengan Prisma.
- Physical table dan column name: lowercase `snake_case`.
- Persistence lokal mencakup metadata aplikasi dan replika read-only 135 GET
  JSON pada `sister_replica_record`, `sister_replica_scope`, `sister_sync_run`.
- Schema `replica` berisi SQL view typed/child dari JSONB; bukan tabel master
  SISTER yang boleh diedit. 2 file dan 3 pencarian/detail pencarian tetap live.
- UI seluruh GET mengikuti [ui_endpoint_map.md](./ui_endpoint_map.md) dan
  [prd_managerial.md](./prd_managerial.md); query UI melalui DTO terkurasi.
- Data lokal sudah tersedia, tetapi sebagian halaman khusus masih memakai
  adapter live. Migrasi UI ke read lokal adalah task UI-DATA.
- Kontrak write pada bagian 6 adalah inventory/portable, bukan scope aktif.

## Kontrak data untuk UI seluruh GET (aktif 2026-09-30)

Peta endpoint → halaman/widget/dependensi ada di
[ui_endpoint_map.md](./ui_endpoint_map.md).
[replica_schema.md](./replica_schema.md) adalah output generator dari sampel;
file itu tidak diedit manual. Tambahan field pada payload baru tidak otomatis
membuat kolom view baru: review hasil generator/migration setelah full sync.

| Lapisan | Fungsi | Aturan baca UI |
|---|---|---|
| `sister_replica_record` | Payload JSONB asli, identitas scope/record dan waktu | Raw JSON bukan default DTO browser |
| `sister_replica_scope` | Fetch terakhir/sukses/error per endpoint + parameter | Empty hanya bila scope berhasil; gagal/belum sync berbeda |
| `sister_sync_run` | Progres dan hasil run | Run terbaru tidak menggantikan status semua scope historis |
| `replica.*` | View typed dan relasi array | Filter integration, SDM/parent, record aktif; kolom nullable |
| DTO modul | Field berlabel dan tipe aman bagi actor | Allowlist field; timestamp/cakupan/state eksplisit |

Target DTO list mempunyai item, pagination/total, sumber, waktu pengambilan dan
status cakupan. Detail menyertakan identitas induk, bagian data serta status
masing-masing bagian; kegagalan dokumen tidak menjadikan profil kosong.
Nama field DTO ditetapkan saat implementasi dan divalidasi Zod.

Relasi yang wajib dijaga:

- SDM berasal dari `/referensi/sdm`; query `id_sdm` per aktivitas.
- Detail/ajuan memakai ID dari list yang sesuai, bukan menukar ID master/ajuan.
- Bidang ilmu menggunakan ID parent; dokumen/penulis/anggota/mahasiswa berasal
  dari array response atau child endpoint yang terdokumentasi.
- Dokumen kelas memakai `id_kelas` detail pengajaran sebagai `id_kls`;
  cocokkan `id_pt` terhadap profil PT.
- BKD aktivitas memakai pasangan SDM + semester laporan akhir SDM.
- Unit kerja memakai profil PT; detail unit memakai ID unit; wilayah memakai
  level dan relasi induk. File menggunakan ID foto/metadata yang terotorisasi.

Kode/identifier tetap string jika semantiknya kode; decimal dan tanggal
ditampilkan sesuai makna sumber. Null, string kosong, nol dan tidak tersedia
tidak disamakan tanpa aturan endpoint. ID referensi tanpa label tidak ditebak.

Report menggunakan query agregat terikat integration/PT dan unit hitung
terdokumentasi. Jangan menghitung list + detail ganda atau seluruh partisipasi
SDM sebagai kegiatan unik. Query agregasi tidak boleh memakai hanya cuplikan
5.000 baris UI. Rule warning memakai data yang cukup lengkap dan fresh;
kegagalan sumber menghasilkan belum dapat dinilai.

Catatan status existing: 404 dapat dinormalkan menjadi scope sukses kosong
oleh sync. Perbaiki pencatatan provenance/status sebelum mengklaim semua
`last_status=200` lokal berarti HTTP 200 upstream. Tidak ada migration baru
dalam task dokumentasi ini.

## Cara mengadaptasi dokumen

Untuk external API lain, pertahankan model boundary dan metadata lokal yang
relevan, lalu ganti nama external system, endpoint, identifier, role, status,
field, dan domain. Jangan membawa field SISTER ke project lain hanya karena
field tersebut tersedia pada schema ini. Untuk repository ini, bagian detail
SISTER di bawah menjadi acuan implementasi dan validasi UAT.

## 1. Prinsip sumber data

SISTER adalah source of truth untuk data perguruan tinggi, SDM, aktivitas
tridharma, dokumen, dan status ajuan.

Database aplikasi tidak boleh menjadi database tandingan SISTER. Penyimpanan
lokal hanya digunakan untuk:

- user dan permission aplikasi;
- konfigurasi instance SISTER serta referensi secret;
- replika response GET dan view typed untuk UI/report, dengan status/freshness;
- audit operasi;
- rekonsiliasi request yang hasilnya belum diketahui;
- cache status ajuan bila fitur tersebut dipakai.

Tidak boleh dibuat entitas bisnis lokal yang tidak memiliki padanan jelas pada
endpoint SISTER. Jika ada kebutuhan bisnis baru, kebutuhan tersebut harus
ditelusuri ke endpoint SISTER terlebih dahulu.

### 1.1 Konvensi nama database

Konvensi ini berlaku untuk semua database project, bukan hanya tabel integrasi:

- nama tabel fisik wajib lowercase `snake_case`, misalnya
  `sister_reference_cache`;
- nama kolom fisik wajib lowercase `snake_case`, misalnya `integration_id` dan
  `created_at`;
- hindari camelCase, PascalCase, spasi, dan singkatan yang tidak jelas;
- nama Prisma model/type boleh mengikuti konvensi bahasa pemrograman, tetapi
  wajib memakai `@@map("nama_table")` dan `@map("nama_kolom")` agar nama fisik
  tetap konsisten;
- setiap perubahan tabel harus melalui `prisma/schema.prisma` dan migration;
- tidak boleh membuat tabel lokal baru jika belum jelas fungsi, owner, retensi,
  dan hubungannya dengan capability external API.

## 2. Kontrak umum API

### 2.1 Format dan identifier

Aturan yang dinyatakan pada PDF:

- request dan response umumnya menggunakan JSON;
- upload dokumen dan foto menggunakan multipart/form-data;
- download dokumen dan foto mengembalikan binary dengan MIME type terkait;
- sebagian besar ID data menggunakan UUID lowercase;
- tanggal request dan response menggunakan format yyyy-mm-dd;
- angka desimal memakai titik sebagai pemisah desimal;
- field request yang opsional dapat memakai null, 0, atau array kosong sesuai
  tipe datanya;
- field JSON request tidak boleh ditambah atau dikurangi dari kontrak endpoint.

Tipe identifier yang perlu dibedakan:

| Identifier | Contoh penggunaan | Bentuk |
| --- | --- | --- |
| id_sdm | pemilik data dosen atau tenaga kependidikan | UUID |
| id resource | ID pendidikan, penelitian, dokumen, dan seterusnya | Umumnya UUID |
| id referensi integer | jenis dokumen, bidang studi, jenis kegiatan | Integer |
| id referensi string | negara, ikatan kerja, skim kegiatan | String |
| id semester | nilai `id` dari `/referensi/semester` | Integer pada endpoint referensi; tipe `id_smt` di endpoint lain tetap mengikuti kontraknya |
| id kelas kuliah | dokumen kelas kuliah | UUID |

### 2.2 Autentikasi

Endpoint login API adalah POST /authorize. Request memiliki field wajib:

    username: string
    password: string
    id_pengguna: string

Response sukses:

    token: string
    role: string

Token dikirim pada seluruh endpoint lain dengan header:

    Authorization: Bearer <token>

Token berlaku selama 60 menit. Response 401 berarti token tidak valid atau
expired. Credential berasal dari sistem manajemen akses Diktiristek dan
berhubungan dengan instance SISTER perguruan tinggi.

Role eksternal yang secara eksplisit dijelaskan:

| Role | Perilaku perubahan |
| --- | --- |
| WS-BASIC | perubahan data PDD menjadi ajuan untuk proses verifikasi |
| WS-PRO | perubahan data dapat langsung diterapkan sesuai kewenangan role |

Role SISTER tersebut tidak boleh disamakan dengan role user lokal aplikasi.

### 2.3 Error dan status HTTP

Response error standar memiliki bentuk:

    message: string
    detail: string

Status yang perlu dimodelkan:

| Status | Arti menurut PDF | Perilaku aplikasi |
| --- | --- | --- |
| 200 | sukses dengan data | parse JSON atau data yang dijelaskan endpoint |
| 204 | sukses tanpa body | tampilkan status berhasil tanpa mencoba parse JSON |
| 400 | request tidak valid | tampilkan error validasi dan detail |
| 401 | credential atau token tidak valid/expired | tandai integrasi/auth bermasalah |
| 403 | perubahan atau resource ditolak | tampilkan alasan dan jangan retry |
| 404 | endpoint atau data tidak ditemukan | tampilkan state tidak ditemukan |
| 405 | metode tidak diizinkan, terutama endpoint read-only | nonaktifkan aksi yang tidak didukung |
| 409 | data duplikat pada endpoint tertentu | tampilkan konflik dan lakukan rekonsiliasi |
| 500 | error generik server | tandai operasi gagal atau perlu pemeriksaan |

PDF tidak mendefinisikan error code bisnis yang stabil. UI tidak boleh
bergantung pada string message untuk menentukan status bisnis.

## 3. Model response bersama

### 3.1 Ringkasan SDM

GET /referensi/sdm mengembalikan data untuk pencarian pegawai:

| Field | Tipe | Keterangan |
| --- | --- | --- |
| id_sdm | string | ID SDM |
| nama_sdm | string | Nama pegawai |
| nidn | string | Nomor induk dosen |
| nip | string | Nomor induk pegawai |
| nuptk | string | Nomor unik pendidik dan tenaga kependidikan |
| nama_status_aktif | string | Status aktif |
| nama_status_pegawai | string | Status pegawai |
| jenis_sdm | string | Dosen atau tenaga kependidikan |

Parameter pencarian yang didokumentasikan:

- id_sp;
- nama;
- nidn;
- nip;
- nuptk.

Jika id_sp digunakan, PDF mensyaratkan nama minimal tiga karakter. Validasi
tersebut harus diberlakukan pada UI dan backend aplikasi.

### 3.1.1 Profil perguruan tinggi

GET `/referensi/profil_pt` pada halaman PDF 249 tidak memiliki parameter
request. Response didokumentasikan sebagai array object dengan field berikut:

| Field | Tipe | Keterangan |
| --- | --- | --- |
| id | string | ID perguruan tinggi |
| kode_perguruan_tinggi | string | Kode perguruan tinggi |
| nama_perguruan_tinggi | string | Nama perguruan tinggi |
| telepon | string | Nomor telepon |
| faximile | string | Nomor faximile |
| email | string | Email perguruan tinggi |
| website | string | Website perguruan tinggi |
| jalan | string | Jalan |
| dusun | string | Dusun |
| rt | integer | Rukun tetangga |
| rw | integer | Rukun warga |
| kelurahan | string | Kelurahan |
| kode_pos | string | Kode pos |
| id_wilayah | string | ID wilayah |

Adapter aplikasi memanggil path tetap tersebut tanpa menerima path atau query
dari browser. DTO tRPC memilih ulang hanya 14 field yang terdokumentasi.
Informasi kontak dan alamat tidak ditulis ke cache lokal pada implementasi
awal; bila nanti perlu disimpan, klasifikasi PII, permission, dan retention
harus ditinjau ulang melalui `security.md`.

### 3.1.2 Semester

GET `/referensi/semester` pada halaman PDF 257-258 tidak memiliki parameter
request. Response didokumentasikan sebagai array object:

| Field | Tipe | Keterangan |
| --- | --- | --- |
| id | integer | ID objek semester |
| nama | string | Nama objek semester |

`id` semester dipakai sebagai referensi untuk endpoint BKD dan domain lain yang
memang mencantumkannya pada kontrak. Aplikasi tidak membuat semester lokal,
tidak mengarang status semester, dan tidak menambahkan pagination karena PDF
tidak mendokumentasikan parameter tersebut pada endpoint ini.

### 3.2 Metadata dokumen

Model dokumen yang muncul berulang pada detail data:

| Field | Tipe | Keterangan |
| --- | --- | --- |
| id | string | ID dokumen |
| nama | string | Nama dokumen |
| jenis_dokumen | string | Nama jenis dokumen |
| nama_file | string | Nama file |
| jenis_file | string | MIME type |
| tanggal_upload | string | Waktu upload |
| tautan | string atau null | Link bila dokumen berupa tautan |
| keterangan | string atau null | Keterangan |

Alur dokumen:

1. POST /dokumen untuk membuat dokumen atau metadata tautan.
2. Simpan ID yang dikembalikan.
3. Kirim ID tersebut pada field dokumen data utama.
4. Jika update, kirim kembali ID dokumen lama yang masih dipertahankan.

POST /dokumen/{id} dipakai untuk mengubah dokumen dan metadata. PDF
menjelaskan bahwa POST digunakan, bukan PUT, karena keterbatasan PHP.

GET /dokumen/{id}/download mengembalikan binary. Aplikasi tidak boleh
menganggap semua response endpoint dokumen sebagai JSON.

### 3.3 Ringkasan ajuan

Model ajuan yang berulang pada jabatan fungsional, pendidikan formal,
sertifikasi dosen, dan nilai tes:

| Field | Tipe | Keterangan |
| --- | --- | --- |
| id | string | ID ajuan |
| id_data_master | string atau null | ID data yang diubah/dihapus; null untuk data baru |
| id_sdm | string | SDM pemilik ajuan |
| tanggal_ajuan | string | Tanggal dan waktu ajuan |
| tanggal_verifikasi | string atau null | Waktu verifikasi |
| jenis_ajuan | string | Baru, Ubah, atau Hapus |
| keterangan | string atau null | Keterangan verifikasi |
| umur | integer | Umur ajuan dalam hari |
| status | string | Status proses ajuan |

Status ajuan yang didokumentasikan:

- Draft;
- Diajukan;
- Disetujui Kepegawaian PT;
- Disetujui Tenaga LLDIKTI;
- Disetujui Subdit Kompetensi SDM Kemenristekdikti;
- Ditolak Kepegawaian PT;
- Ditolak Tenaga LLDIKTI;
- Ditolak Subdit Kompetensi SDM Kemenristekdikti;
- Ditangguhkan Kepegawaian PT;
- Ditangguhkan oleh Tenaga LLDIKTI;
- Ditangguhkan oleh Subdit Kompetensi SDM Kemenristekdikti.

Detail ajuan menambahkan detail_perubahan dan array dokumen. Nilai status
harus disimpan sebagai string yang dapat diperluas karena daftar status dapat
berubah pada versi API berikutnya.

### 3.4 Baris BKD

Endpoint BKD membaca data berdasarkan SDM dan semester. Model activity yang
berulang memiliki field:

| Field | Tipe |
| --- | --- |
| nm_sdm | string |
| nidn | string |
| id_smt | string atau integer sesuai endpoint |
| unsur | string |
| judul_keg | string |
| id_katgiat | integer |
| nm_kat | string |
| beban_sks | number |
| nilai | number |

GET /bkd/laporan_akhir_bkd mengembalikan ringkasan yang berbeda, antara lain
id_reg_ptk, id_smt, SKS kinerja/lebih untuk beberapa unsur, status kewajiban,
status tugas, status belajar, id jabatan fungsional, dan simpulan asesor.

### 3.4.1 Kontrak endpoint BKD yang dipilih

Kontrak berikut berasal dari halaman PDF 19-26 dan menjadi batas implementasi
modul `bkd` read-only.

`GET /bkd/laporan_akhir_bkd` menerima query wajib `id_sdm` bertipe UUID dan
mengembalikan array object dengan field:

| Field | Tipe PDF |
| --- | --- |
| id_reg_ptk | uuid |
| id_smt | bpchar/string |
| sks_kinerja_ajar | numeric |
| sks_lebih_ajar | numeric |
| sks_kinerja_didik | numeric |
| sks_lebih_didik | numeric |
| sks_kinerja_lit | numeric |
| sks_lebih_lit | numeric |
| sks_kinerja_pengmas | numeric |
| sks_lebih_pengmas | numeric |
| sks_kinerja_penunjang | numeric |
| sks_lebih_tunjang | numeric |
| sks_kinerja | numeric |
| sks_lebih | numeric |
| stat_kewajiban | numeric |
| stat_tugas | bpchar/string |
| stat_belajar | bpchar/string |
| id_jabfung | numeric |
| simpulan_asesor | bpchar/string |

Lima endpoint aktivitas berikut menerima query wajib `id_sdm` bertipe UUID dan
`id_smt` bertipe string:

- GET `/bkd/pendidikan`;
- GET `/bkd/ajar`;
- GET `/bkd/tunjang`;
- GET `/bkd/pengmas`;
- GET `/bkd/penelitian`.

Masing-masing mengembalikan array object dengan field yang sama:

| Field | Tipe PDF |
| --- | --- |
| nm_sdm | string |
| nidn | string |
| id_smt | string |
| unsur | string |
| judul_keg | string |
| id_katgiat | integer |
| nm_kat | string |
| beban_sks | number |
| nilai | number |

Tidak ada parameter pagination pada keenam endpoint ini. `id_sdm` harus berasal
dari hasil `/referensi/sdm`, sedangkan pilihan semester berasal dari
`/referensi/semester` dan dikirim sebagai string query sesuai contoh PDF.
Response kosong adalah empty state, bukan error. Implementasi awal tidak
menyimpan baris BKD ke Prisma atau cache lokal.

### 3.5 Penugasan dan penempatan

Kontrak berikut berasal dari halaman PDF 209-210 dan menjadi batas modul
`penugasan` read-only.

`GET /penugasan` menerima query wajib `id_sdm` bertipe UUID dan mengembalikan
array object dengan 8 field:

| Field | Tipe PDF | Keterangan |
| --- | --- | --- |
| id | string | ID penugasan/penempatan |
| status_kepegawaian | string | Status kepegawaian |
| ikatan_kerja | string | Ikatan kerja |
| unit_kerja | string | Nama unit kerja di perguruan tinggi |
| jenjang_pendidikan | string | Jenjang pendidikan unit kerja |
| perguruan_tinggi | string | Nama perguruan tinggi |
| tanggal_mulai | string | TMT penempatan |
| tanggal_keluar | string | Tanggal keluar jika SDM sudah keluar |

`GET /penugasan/{id}` menerima path `id` bertipe UUID dan mengembalikan object
detail dengan 8 field list di atas serta field tambahan:

| Field | Tipe PDF | Keterangan |
| --- | --- | --- |
| id_sdm | string | ID SDM pemilik data |
| surat_tugas | string | Nomor surat tugas |
| tanggal_surat_tugas | string | Tanggal surat tugas |
| jenis_keluar | string | Keterangan keluar |
| id_jenis_keluar | string | ID jenis keluar bila ada |
| id_status_kepegawaian | integer | ID status kepegawaian |
| id_ikatan_kerja | string | ID ikatan kerja |
| id_perguruan_tinggi | string | ID perguruan tinggi |
| id_unit_kerja | string | ID unit kerja |

List dan detail tidak memiliki parameter pagination atau mutation. UI memilih
SDM dari `/referensi/sdm`, memilih detail dari hasil list, dan menampilkan
empty/error state secara terpisah. Implementasi awal tidak menyimpan
penugasan ke Prisma.

### 3.6 Pendidikan formal

Kontrak berikut berasal dari halaman PDF 153-158 dan menjadi batas modul
`pendidikan_formal` read-only pada slice ini. Endpoint POST, PUT, DELETE, dan
endpoint ajuan berada di luar scope implementasi awal.

`GET /pendidikan_formal` menerima query wajib `id_sdm` bertipe UUID dan
mengembalikan array object dengan 7 field:

| Field | Tipe PDF | Keterangan |
| --- | --- | --- |
| id | string | ID riwayat pendidikan formal |
| jenjang_pendidikan | string | Jenjang pendidikan |
| gelar_akademik | string | Gelar akademik |
| bidang_studi | string | Bidang studi |
| nama_perguruan_tinggi | string | Nama perguruan tinggi |
| tahun_lulus | integer | Tahun lulus |
| jenis_ajuan | integer | ID/jenis ajuan sesuai response list PDF |

`GET /pendidikan_formal/{id}` menerima path `id` bertipe UUID dan
mengembalikan object detail dengan field berikut:

| Field | Tipe PDF | Keterangan |
| --- | --- | --- |
| id | string | ID riwayat pendidikan formal |
| jenjang_pendidikan | string | Jenjang pendidikan |
| gelar_akademik | string | Gelar akademik |
| bidang_studi | string | Bidang studi |
| nama_perguruan_tinggi | string | Nama perguruan tinggi |
| tahun_lulus | integer | Tahun lulus |
| jenis_ajuan | string | Jenis ajuan pada response detail PDF |
| kategori_kegiatan | string | Nama kategori kegiatan |
| id_sdm | string | ID SDM pemilik data |
| id_program_studi | string | ID program studi |
| nama_program_studi | string | Nama program studi |
| id_jenjang_pendidikan | integer | ID jenjang studi |
| id_gelar_akademik | integer | ID gelar akademik |
| id_bidang_studi | integer | ID bidang studi |
| tahun_masuk | integer | Tahun masuk |
| tanggal_lulus | string | Tanggal kelulusan |
| nomor_induk | string | Nomor induk ketika menjadi mahasiswa |
| jumlah_semester | integer | Jumlah semester yang ditempuh |
| jumlah_sks | integer | Jumlah SKS sampai lulus |
| ipk | number | IPK saat lulus |
| sk_penyetaraan | string | Nomor SK penyetaraan |
| tanggal_sk_penyetaraan | string | Tanggal SK penyetaraan |
| nomor_ijazah | string | Nomor ijazah |
| judul_tugas_akhir | string | Judul tesis/disertasi |
| dokumen | array | Metadata dokumen yang menyertai data |

Object pada `dokumen` memiliki 8 field string: `id`, `nama`, `jenis_dokumen`,
`nama_file`, `jenis_file`, `tanggal_upload`, `tautan`, dan `keterangan`.
Schema list dan detail sengaja dipisahkan karena PDF mendokumentasikan tipe
`jenis_ajuan` yang berbeda pada kedua response. Tidak ada pagination pada kedua
GET tersebut, dan binary download dokumen belum dibuka pada slice ini.

### 3.7 Riwayat pekerjaan

Kontrak berikut berasal dari halaman PDF 260-263 dan menjadi batas modul
`riwayat_pekerjaan` read-only pada slice ini. Endpoint POST, PUT, dan DELETE
berada di luar scope implementasi awal.

`GET /riwayat_pekerjaan` menerima query wajib `id_sdm` bertipe UUID dan
mengembalikan array object dengan 9 field:

| Field | Tipe PDF | Keterangan |
| --- | --- | --- |
| id | string | ID riwayat pekerjaan |
| jenis_pekerjaan | string | Jenis pekerjaan |
| nama_jabatan | string | Nama jabatan |
| instansi | string | Instansi |
| divisi | string | Divisi |
| mulai_bekerja | string | Tanggal mulai bekerja |
| selesai_bekerja | string | Tanggal selesai bekerja |
| luar_negeri | boolean | True jika pekerjaan di luar negeri |
| bidang_usaha | string | Bidang usaha |

`GET /riwayat_pekerjaan/{id}` menerima path `id` bertipe UUID dan
mengembalikan object detail dengan 9 field list di atas serta field tambahan:

| Field | Tipe PDF | Keterangan |
| --- | --- | --- |
| id_sdm | string | ID SDM pemilik data |
| id_bidang_usaha | integer | ID bidang usaha |
| id_jenis_pekerjaan | integer | ID jenis pekerjaan |
| deskripsi_kerja | string | Deskripsi kerja |
| dokumen | array | Metadata dokumen yang menyertai data |

Object pada `dokumen` memiliki 8 field string: `id`, `nama`, `jenis_dokumen`,
`nama_file`, `jenis_file`, `tanggal_upload`, `tautan`, dan `keterangan`.
Tidak ada pagination pada kedua GET tersebut, dan binary download dokumen belum
dibuka pada slice ini.

## 4. Inventaris domain SISTER

Indeks PDF mencantumkan 236 endpoint unik. Heading endpoint muncul pada bagian
indeks dan bagian detail, sehingga hitungan mentah teks menjadi dua kali lipat.
Rincian domain berikut adalah hitungan unik dari indeks PDF.

| No | Domain | Pola endpoint | Jumlah | Catatan schema |
| ---: | --- | --- | ---: | --- |
| 1 | Akses | POST /authorize | 1 | Auth API |
| 2 | Anggota Profesi | GET/POST/PUT/DELETE /anggota_profesi | 5 | Data penunjang SDM dan dokumen |
| 3 | BKD | GET /bkd/* | 6 | Read berdasarkan SDM dan semester |
| 4 | Bahan Ajar | CRUD /bahan_ajar | 5 | Penulis dan dokumen |
| 5 | Beasiswa | CRUD /beasiswa | 5 | Data beasiswa dosen |
| 6 | Bimbing Dosen | GET /bimbing_dosen | 2 | Sumber PDDIKTI, read-only |
| 7 | Bimbingan Mahasiswa | GET dan bidang_ilmu | 4 | Base data read-only, nested PUT perlu validasi |
| 8 | Data Pokok | GET/PUT/POST /data_pribadi/* | 13 | Profil, kependudukan, keluarga, alamat, kepegawaian, foto |
| 9 | Detasering | CRUD /detasering | 5 | Data detasering SDM |
| 10 | Diklat | CRUD /diklat | 5 | Data pendidikan/pelatihan |
| 11 | Dokumen | GET/POST/DELETE /dokumen | 6 | Upload, metadata, dan binary download |
| 12 | Inpassing | CRUD /inpassing | 5 | Riwayat inpassing |
| 13 | Jabatan Fungsional | CRUD dan /ajuan | 7 | Ajuan baru, ubah, hapus |
| 14 | Jabatan Struktural | CRUD /jabatan_struktural | 5 | Jabatan dan dokumen |
| 15 | Kekayaan Intelektual | CRUD dan bidang_ilmu | 7 | List mendukung page/per_page |
| 16 | Kelas Kuliah | Dokumen kelas kuliah | 3 | Tautan dokumen, harus milik PT pemilik token |
| 17 | Kepangkatan | GET /kepangkatan | 2 | Read-only |
| 18 | Kesejahteraan | CRUD /kesejahteraan | 5 | Data kesejahteraan |
| 19 | Kolaborator Eksternal | CRUD /kolaborator_eksternal | 5 | Mitra/profesional |
| 20 | Orasi Ilmiah | CRUD /orasi_ilmiah | 5 | Aktivitas tridharma |
| 21 | Pembicara | CRUD /pembicara | 5 | Aktivitas sebagai pembicara |
| 22 | Pendidikan Formal | CRUD dan /ajuan | 7 | Ajuan untuk WS-BASIC |
| 23 | Penelitian | CRUD dan bidang_ilmu | 7 | List mendukung page/per_page |
| 24 | Pengabdian | CRUD dan bidang_ilmu | 7 | List mendukung page/per_page |
| 25 | Pengajaran | GET dan bidang_ilmu | 4 | Base data read-only, nested PUT perlu validasi |
| 26 | Pengelola Jurnal | CRUD /pengelola_jurnal | 5 | Aktivitas pengelolaan jurnal |
| 27 | Penghargaan | CRUD /penghargaan | 5 | Data penghargaan |
| 28 | Pengujian Mahasiswa | GET dan bidang_ilmu | 4 | Base data read-only, nested PUT perlu validasi |
| 29 | Penugasan | GET /penugasan | 2 | Read-only |
| 30 | Penunjang Lain | CRUD /penunjang_lain | 5 | List mendukung page/per_page |
| 31 | Publikasi | CRUD dan bidang_ilmu | 7 | List mendukung page/per_page |
| 32 | Referensi | GET /referensi/* | 41 | Sumber option dan pencarian |
| 33 | Riwayat Pekerjaan | CRUD /riwayat_pekerjaan | 5 | Riwayat pekerjaan |
| 34 | Sertifikasi Dosen | GET dan /ajuan | 4 | Data dan status ajuan |
| 35 | Sertifikasi Profesi | CRUD /sertifikasi_profesi | 5 | Sertifikasi profesi |
| 36 | Tes | GET dan CRUD /nilai_tes/ajuan | 7 | Nilai tes dan ajuan |
| 37 | Tugas Tambahan | CRUD /tugas_tambahan | 5 | Tugas tambahan |
| 38 | Tunjangan | CRUD /tunjangan | 5 | Data tunjangan |
| 39 | Visiting Scientist | CRUD /visiting_scientist | 5 | Aktivitas visiting scientist |

Komposisi method endpoint unik:

- GET: 140;
- POST: 31;
- PUT: 37;
- DELETE: 28.

## 5. Query dan pagination

### 5.1 Parameter berbasis SDM

Sebagian besar list personal memakai query wajib id_sdm. Aplikasi harus
memilih SDM melalui GET /referensi/sdm dan tidak meminta user mengetik UUID
secara bebas.

### 5.2 BKD

Endpoint:

- GET /bkd/laporan_akhir_bkd memakai id_sdm;
- GET /bkd/pendidikan memakai id_sdm dan id_smt;
- GET /bkd/ajar memakai id_sdm dan id_smt;
- GET /bkd/tunjang memakai id_sdm dan id_smt;
- GET /bkd/pengmas memakai id_sdm dan id_smt;
- GET /bkd/penelitian memakai id_sdm dan id_smt.

id_smt diambil dari GET /referensi/semester.

### 5.3 Pagination yang terdokumentasi

Parameter per_page dan page dicantumkan pada list:

- GET /kekayaan_intelektual;
- GET /penelitian;
- GET /pengabdian;
- GET /penunjang_lain;
- GET /publikasi.

Contoh PDF menggunakan per_page 100 dan page 1. Response model ditulis sebagai
array object dan tidak menjelaskan metadata total, sehingga adapter tidak boleh
mengasumsikan ada total_pages atau total_items sebelum menguji response aktual.

### 5.4 Referensi bertingkat

Referensi yang memiliki dependensi:

| Endpoint | Parameter atau hubungan |
| --- | --- |
| /referensi/unit_kerja | id_perguruan_tinggi |
| /referensi/detail_unit_kerja | id_unit_kerja |
| /referensi/mahasiswa_pddikti | id_perguruan_tinggi, id_program_studi, keyword |
| /referensi/wilayah | id_level_wilayah 0 sampai 3 |
| /referensi/kategori_kegiatan | tipe list/tree dan menu tertentu |
| /referensi/kelompok_bidang | iptek true/false |
| /referensi/media_publikasi | nama |

Referensi sederhana umumnya mengembalikan array dengan id dan nama. Beberapa
referensi menggunakan id string, integer, atau field tambahan seperti
singkatan.

## 6. Aturan payload domain

### 6.1 CRUD standar

Untuk domain CRUD, pola umumnya:

- GET koleksi memakai id_sdm;
- POST koleksi mengembalikan object berisi id;
- GET /resource/{id} mengembalikan detail lengkap;
- PUT /resource/{id} menerima payload penuh dan mengembalikan detail pada
  endpoint yang mendukung response 200;
- DELETE /resource/{id} mengembalikan 204 bila berhasil.

Detail tiap domain memiliki field wajib, batas panjang, enum, serta array yang
berbeda. Tipe runtime harus dihasilkan dari YAML API resmi atau ditulis
berdasarkan endpoint yang benar-benar dipilih untuk MVP. Jangan membuat satu
payload generik lalu mengirimnya ke semua resource.

### 6.2 Data pokok

Data pokok dibagi menjadi:

- foto;
- profil;
- kependudukan;
- keluarga;
- alamat dan kontak;
- kepegawaian;
- data pribadi lain;
- bidang ilmu.

Field sensitif yang terdokumentasi mencakup NIK, NPWP, email, alamat, nomor
telepon, NIP, NIDN, dan data pasangan. Aplikasi wajib menerapkan permission,
redaksi log, dan minimisasi penyimpanan.

### 6.3 Data penelitian, pengabdian, publikasi, dan bahan ajar

Resource tridharma dapat memiliki:

- id kategori kegiatan;
- referensi bidang ilmu;
- hubungan penelitian/pengabdian;
- dokumen;
- penulis dosen;
- penulis mahasiswa;
- penulis lain atau kolaborator;
- urutan dan peran penulis.

Penulis dosen merujuk id_sdm. Penulis mahasiswa dapat dirujuk melalui
referensi mahasiswa PDDIKTI. Field array penulis harus dipertahankan lengkap
saat update.

### 6.4 Ajuan WS-BASIC

Untuk endpoint yang menjelaskan perilaku WS-BASIC, response sukses dapat 204
tanpa ID data master. Aplikasi harus:

1. mencatat request sebagai operasi lokal;
2. menampilkan bahwa request menjadi ajuan;
3. membaca endpoint /ajuan terkait untuk mendapatkan status;
4. tidak menganggap 204 sebagai data sudah langsung berubah;
5. menyediakan rekonsiliasi melalui detail/list SISTER.

### 6.5 Bidang ilmu

Beberapa resource memiliki endpoint GET dan PUT terpisah untuk bidang_ilmu.
Payload list menggunakan urutan array. Schema aplikasi harus mempertahankan
urutan dan ID kelompok bidang, bukan hanya menyimpan label tampilannya.

## 7. Schema penyimpanan lokal

Schema lokal mencakup metadata aplikasi serta replika response GET SISTER.
Tidak ada koneksi langsung ke database internal SISTER dan tidak ada UI edit replika.

### 7.0 Implementasi Prisma

Untuk repository `sister-integrated`, schema lokal direalisasikan di
`prisma/schema.prisma` menggunakan PostgreSQL dan Prisma. Prisma hanya menjadi
data access layer untuk database aplikasi; Prisma tidak terhubung langsung ke
database internal SISTER.

- satu model lokal mewakili metadata yang memang dimiliki aplikasi;
- nama tabel dan kolom yang dibuat PostgreSQL tetap lowercase `snake_case`;
- field JSON dipakai hanya untuk payload/cache yang memang perlu disimpan dan
  sudah melalui redaction atau minimisasi PII;
- query Prisma dipanggil dari repository/service server, bukan dari component,
  page client, atau widget;
- migration harus dapat dijalankan ulang pada environment kosong;
- perubahan schema harus memperbarui bagian ini, `architecture.md`, dan TODO
  terkait secara bersamaan.

### 7.1 app_user

| Field | Tipe | Aturan |
| --- | --- | --- |
| id | UUID | primary key lokal |
| email | string | unik |
| name | string | nama user lokal |
| role | enum lokal | ADMIN, OPERATOR, REVIEWER, VIEWER |
| is_active | boolean | user dapat login atau tidak |
| created_at | timestamp | audit |
| updated_at | timestamp | audit |

Role lokal hanya mengatur akses aplikasi. Ia tidak mengubah role WS-BASIC atau
WS-PRO di SISTER.

### 7.2 sister_integration

| Field | Tipe | Aturan |
| --- | --- | --- |
| id | UUID | primary key lokal |
| external_pt_id | string | ID PT dari /referensi/profil_pt bila tersedia |
| base_url | string | URL instance SISTER, wajib dikonfirmasi |
| api_version | string | default dokumentasi 1.0.0 |
| credential_ref | string | referensi secret, bukan password |
| expected_role | string | WS-BASIC atau WS-PRO bila sudah dikonfirmasi |
| is_enabled | boolean | integrasi aktif |
| last_health_at | timestamp atau null | pemeriksaan terakhir |
| created_at | timestamp | audit |
| updated_at | timestamp | audit |

Password dan token tidak boleh disimpan dalam kolom biasa. Token API hanya
disimpan di memory process atau secret/cache terenkripsi dengan TTL.

### 7.3 sister_reference_cache

| Field | Tipe | Aturan |
| --- | --- | --- |
| id | UUID | primary key lokal |
| integration_id | UUID | foreign key |
| endpoint | string | path referensi |
| query_hash | string | hash query canonical |
| payload_json | JSON | response terakhir |
| fetched_at | timestamp | waktu fetch |
| expires_at | timestamp | batas valid cache |
| last_error | string atau null | error terakhir bila refresh gagal |

Cache referensi dapat dihapus dan dibangun ulang. Cache tidak boleh dianggap
sebagai data yang lebih baru daripada SISTER.

Implementasi awal repository membaca profil PT dan semester melalui adapter
fixture atau SISTER secara langsung tanpa menulis `sister_reference_cache`.
Tabel cache tetap menjadi opsi portable untuk kebutuhan performa setelah TTL,
invalidasi, dan minimisasi data disetujui; keberadaan model cache tidak berarti
semua endpoint referensi harus langsung dicache.

### 7.4 sister_sdm_index_cache

Cache minimal dari GET /referensi/sdm untuk pencarian dan navigasi.

| Field | Tipe | Aturan |
| --- | --- | --- |
| integration_id | UUID | foreign key |
| id_sdm | UUID/string | primary key external dalam instance |
| nama_sdm | string | field pencarian |
| nidn | string atau null | field pencarian |
| nip | string atau null | field pencarian |
| nuptk | string atau null | field pencarian |
| nama_status_aktif | string atau null | tampilan |
| nama_status_pegawai | string atau null | tampilan |
| jenis_sdm | string atau null | Dosen atau Tenaga Kependidikan |
| fetched_at | timestamp | umur cache |

NIK, NPWP, alamat, kontak, dan data keluarga tidak disimpan pada cache indeks
ini.

Implementasi repository dapat melakukan upsert ringkasan setelah query live dan
lookup summary berdasarkan composite key `integration_id` + `id_sdm` hanya bila
`fetched_at` masih berada dalam TTL konfigurasi. Cache gagal atau stale harus
menjadi alasan fallback ke SISTER, bukan alasan mengembalikan data tanpa status.
Profil dan kepegawaian detail tidak termasuk cache indeks ini.

### 7.5 sister_operation

Satu baris untuk setiap request penting ke SISTER, terutama operasi perubahan.

| Field | Tipe | Aturan |
| --- | --- | --- |
| id | UUID | ID operasi lokal dan correlation ID |
| integration_id | UUID | foreign key |
| actor_user_id | UUID atau null | user pemicu |
| method | string | GET, POST, PUT, DELETE |
| path_template | string | path tanpa secret |
| resource_type | string | domain SISTER |
| resource_id | string atau null | ID external bila diketahui |
| request_fingerprint | string | hash payload canonical |
| request_redacted_json | JSON atau null | payload tanpa secret/PII sensitif yang tidak perlu |
| response_status | integer atau null | status HTTP |
| external_id | string atau null | ID yang dikembalikan SISTER |
| local_status | enum | PENDING, SUCCEEDED, FAILED, NEEDS_REVIEW |
| external_message | string atau null | message |
| external_detail | string atau null | detail |
| started_at | timestamp | awal operasi |
| finished_at | timestamp atau null | akhir operasi |

NEEDS_REVIEW digunakan ketika timeout atau gangguan jaringan membuat hasil
eksternal tidak dapat dipastikan. Operasi seperti ini tidak boleh otomatis
diulang untuk POST, PUT, atau DELETE.

### 7.6 security_audit_event

Audit security dipisahkan dari audit operasi SISTER. Model ini mencatat
authentication, authorization, policy enforcement, secret event, suspicious
request, dan perubahan konfigurasi security. Nama tabel fisik dan seluruh kolom
fisik wajib lowercase `snake_case`.

| Field | Tipe | Aturan |
| --- | --- | --- |
| id | UUID | primary key lokal |
| event_type | string/enum | tipe event security |
| severity | enum | INFO, LOW, MEDIUM, HIGH, CRITICAL |
| outcome | enum | SUCCESS, DENIED, FAILED, BLOCKED, DETECTED |
| actor_user_id | UUID atau null | user lokal bila diketahui |
| integration_id | UUID atau null | konteks integrasi bila relevan |
| request_id | string | correlation ID |
| route_or_procedure | string | template route/procedure, bukan query mentah |
| target_type | string atau null | tipe resource |
| target_id | string atau null | ID yang aman dicatat |
| source_ip_hash | string atau null | keyed hash bila dibutuhkan, bukan IP mentah default |
| user_agent_hash | string atau null | hash atau metadata minimal |
| metadata_redacted_json | JSON atau null | sudah redacted dan diminimalkan |
| created_at | timestamp | waktu server tersinkron |
| reviewed_at | timestamp atau null | waktu review |
| reviewed_by | UUID atau null | reviewer security |

Event tidak boleh berisi password, bearer token, cookie, Authorization header,
raw body, binary, full URL query sensitif, atau PII penuh. Model ini bersifat
append-oriented; perubahan/penghapusan hanya dapat dilakukan oleh proses
terbatas dan harus terdeteksi.

### 7.7 sister_ajuan_cache

Cache status ajuan yang dibaca dari endpoint /ajuan.

| Field | Tipe |
| --- | --- |
| integration_id | UUID |
| external_ajuan_id | string |
| resource_type | string |
| id_data_master | string atau null |
| id_sdm | string |
| tanggal_ajuan | timestamp/string |
| tanggal_verifikasi | timestamp/string atau null |
| jenis_ajuan | string |
| status | string |
| keterangan | string atau null |
| umur | integer atau null |
| detail_perubahan_json | JSON atau null |
| fetched_at | timestamp |

Primary key yang disarankan adalah integration_id plus external_ajuan_id.

### 7.8 sister_document_reference

Metadata dokumen yang diperlukan untuk operasi dan tampilan.

| Field | Tipe | Aturan |
| --- | --- | --- |
| integration_id | UUID | foreign key |
| external_document_id | string | ID dokumen SISTER |
| id_sdm | string atau null | pemilik bila diketahui |
| resource_type | string atau null | resource yang menggunakannya |
| resource_id | string atau null | resource yang menggunakannya |
| nama | string | metadata SISTER |
| nama_file | string atau null | metadata SISTER |
| jenis_file | string atau null | MIME type |
| tautan | string atau null | link eksternal bila ada |
| fetched_at | timestamp | waktu sinkronisasi metadata |

Binary tidak disimpan lokal secara default. Jika aplikasi memang perlu
menyimpan salinan, kebijakan retensi, enkripsi, akses, dan penghapusan harus
disetujui terpisah.

## 8. Invariant schema

1. Semua request domain memiliki integration context yang jelas.
2. id_sdm harus berasal dari instance SISTER yang sama dengan token.
3. ID referensi harus berasal dari endpoint referensi yang relevan.
4. Payload PUT dibentuk dari detail lengkap SISTER dan perubahan form, bukan
   dari field form yang dikirim sebagian.
5. Dokumen lama dipertahankan pada payload update bila masih digunakan.
6. Response 204 tidak diparse sebagai JSON.
7. Data read-only tidak memiliki tombol create, edit, atau delete pada UI.
8. Ajuan tidak ditampilkan sebagai data master yang sudah final.
9. Cache mempunyai umur dan dapat berstatus stale.
10. Audit operasi dan audit security tidak menyimpan password, bearer token,
    cookie, raw body, atau binary dokumen.
11. Akses baca/tulis `security_audit_event` dibatasi dan perubahan audit dapat
    dideteksi.

## 9. Rujukan halaman PDF

| Bagian | Halaman PDF | Isi yang menjadi dasar |
| --- | ---: | --- |
| Aturan umum, auth, role, status | 1-2 | format data, token 60 menit, WS-BASIC/WS-PRO, HTTP status |
| Security scheme dan authorize | 10-11 | Bearer token dan payload POST /authorize |
| Indeks endpoint | 3-9 | 39 domain dan 236 endpoint unik |
| BKD | 19-26 | laporan akhir dan aktivitas per semester |
| Bimbingan dan data PDDIKTI | 41-48 | read-only base data dan bidang ilmu |
| Data pokok | 49-61 | profil, kependudukan, keluarga, alamat, kepegawaian, foto |
| Dokumen | 77-83 | multipart, metadata, update, delete, binary download |
| Kelas kuliah | 117-120 | dokumen berupa tautan dan ownership PT |
| Pendidikan formal | 153-162 | payload pendidikan dan endpoint ajuan |
| Penelitian dan pengabdian | 163-184 | CRUD, pagination, bidang ilmu, dokumen, penulis |
| Pengajaran | 185-188 | data read-only dan bidang ilmu |
| Pengujian mahasiswa | 204-207 | data read-only dan bidang ilmu |
| Publikasi | 219-230 | CRUD, pagination, bidang ilmu, penulis, dokumen |
| Referensi | 231-259 | option, relasi unit kerja, wilayah, SDM, semester |
| Sertifikasi dosen | 267-271 | data dan status ajuan |
| Nilai tes | 279-286 | data tes dan CRUD ajuan |

## 10. Kontrak yang wajib dikonfirmasi

Hal berikut belum dapat dijadikan schema final hanya dari PDF:

- base URL instance PT;
- YAML OpenAPI resmi;
- ukuran dan MIME file yang diterima untuk setiap jenis dokumen;
- aturan rate limit dan timeout;
- metadata pagination pada response aktual;
- status 400 dan 401 pada download dokumen yang ditulis tidak konsisten pada
  PDF;
- response model JSON pada endpoint binary foto/download perlu diverifikasi
  dengan Content-Type aktual;
- status endpoint /data_pribadi/ajuan yang dirujuk PDF tetapi tidak muncul di
  indeks;
- makna nested bidang_ilmu PUT pada domain yang dinyatakan read-only;
- detail SSO untuk aplikasi eksternal;
- provider authentication/session, cookie policy, CSRF strategy, dan MFA bila
  dibutuhkan;
- security audit retention, reviewer, export/alert, dan privacy policy untuk
  source_ip_hash/user_agent_hash;
- encryption-at-rest, backup, restore, dan database runtime privilege.

## 11. Adaptasi ke repository lain

Sebelum memakai dokumen ini pada repository lain, lakukan langkah berikut:

1. Identifikasi external API dan tetapkan source of truth-nya.
2. Ganti seluruh prefix `sister_` dengan prefix external system bila memang
   diperlukan, atau gunakan nama netral seperti `integration_*`.
3. Ganti inventory endpoint, field, identifier, role, status, dan aturan
   multipart sesuai dokumentasi external API tujuan.
4. Pertahankan tabel metadata lokal hanya jika ada kebutuhan aplikasi yang
   dapat dibuktikan. Jangan menyalin tabel SISTER sebagai default.
5. Sesuaikan mapping Prisma dan migration dengan database repository tujuan.
6. Sesuaikan model security audit, privacy, retention, dan access review dengan
   [security.md](./security.md).
7. Tandai field yang belum diverifikasi sebagai `NEEDS_REVIEW`; jangan
   mengubah asumsi menjadi kontrak hanya karena nama field terlihat serupa.

Untuk `sister-integrated`, jangan menghapus bagian SISTER di atas saat
beradaptasi internal. Bagian tersebut adalah kontrak detail project ini,
sedangkan bagian portable menjadi pola yang dapat dipakai ulang.
