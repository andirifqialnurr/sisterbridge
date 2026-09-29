# Portable Architecture Contract

Status dokumen: portable base + project profile

Dokumen ini memiliki dua lapisan. Bagian prinsip, boundary, dan pola folder
bersifat portable. Bagian `Project Profile` berisi keputusan untuk repository
`sister-integrated` dan harus diganti jika dokumen dipindahkan ke project lain.

## Project Profile: `sister-integrated`

- External system: SISTER Web Service PT, API Reference versi 1.0.0.
- Scope reference: 236 endpoint unik dalam 39 domain; release tidak otomatis
  mengimplementasikan seluruh endpoint.
- Web application: Next.js App Router, React, dan TypeScript.
- Package runner/runtime: Bun 1.3.x dengan `bun.lock` dan `bunfig.toml`; gunakan
  `bun install` dan `bun run <script>` untuk workflow repository ini.
- Internal API: tRPC dengan TanStack React Query.
- Local persistence: PostgreSQL melalui Prisma.
- Shared UI: `src/component/ui/`; reusable composite UI: `src/component/widget/`.
- Theme configuration: `src/const/theme.ts`, dengan warna primary hijau dan
  chart ApexCharts.
- Module convention: setiap fitur memiliki satu folder module, misalnya
  `src/modules/pegawai/`, `src/modules/referensi/`, `src/modules/bkd/`,
  `src/modules/penugasan/`, `src/modules/pendidikan_formal/`, atau
  `src/modules/riwayat_pekerjaan/` dengan
  subfolder `page/`, `api/`, dan `widget/` sesuai kebutuhan.

Pada project lain, ganti external system, framework, persistence, theme, dan
nama module pada profile. Pertahankan boundary keamanan dan aturan adaptasi
yang dijelaskan setelahnya.

Untuk repository ini, boundary external dibatasi oleh [SISTER Web Service PT.pdf](../SISTER%20Web%20Service%20PT.pdf)
dengan kontrak visual pada [design-system.md](./design-system.md) dan security
baseline pada [security.md](./security.md). Tujuannya adalah
membangun lapisan kerja aman di atas SISTER, bukan menggantikan atau menyalin
database SISTER.

## 1. Keputusan arsitektur utama

1. SISTER menjadi source of truth.
2. Browser tidak pernah memanggil API SISTER secara langsung.
3. Credential dan bearer token hanya digunakan di server.
4. API SISTER diakses melalui adapter typed yang eksplisit.
5. Tidak ada generic proxy yang menerima path arbitrary dari browser.
6. Read, write, upload dokumen, dan rekonsiliasi dipisahkan sebagai use case.
7. Operasi write tidak diulang otomatis bila hasil eksternal tidak diketahui.
8. Role lokal aplikasi dan role WS-BASIC/WS-PRO dipetakan secara terpisah.
9. Domain SISTER yang read-only tidak mendapat UI mutation.
10. Component dasar dan widget tidak boleh memuat aturan bisnis external system.
11. Nama tabel dan kolom database fisik menggunakan `snake_case`.
12. Design system diambil sebagai primitive dan token, bukan sebagai alasan
    menyalin route atau domain dari project reference.
13. Audit operasi bisnis dan audit security disimpan sebagai event terpisah
    dengan redaction dan akses terbatas.
14. Tahap 1 (2026-09-29): seluruh data GET SISTER direplikasi read-only ke
    PostgreSQL lokal oleh job `sister:sync`; SISTER tetap source of truth dan
    replika tidak pernah menulis balik. Detail di
    [sister_replica.md](./sister_replica.md).
15. User aplikasi login dengan akun lokal (better-auth, email + password,
    dibuat admin); credential SISTER hanya dipakai server untuk
    `POST /authorize`.

## 2. Stack yang direkomendasikan

### 2.1 Aplikasi

- Next.js dengan React dan TypeScript.
- App Router untuk route halaman dan server boundary.
- tRPC sebagai API internal typed antara UI dan server aplikasi.
- Next.js Route Handler sebagai transport tRPC dan endpoint khusus file.
- PostgreSQL untuk metadata lokal.
- Prisma sebagai data access layer lokal.

### 2.1.1 Naming dan physical database

Nama tabel dan kolom database fisik wajib memakai lowercase `snake_case`,
misalnya `sister_operation`, `integration_id`, dan `created_at`. Prisma model
serta type TypeScript boleh memakai identifier code yang idiomatis, tetapi wajib
memetakan nama fisik dengan `@@map()` dan `@map()` bila berbeda. Tidak boleh ada
nama tabel database baru dalam camelCase, PascalCase, atau campuran tanpa
persetujuan perubahan schema.

Next.js dipilih karena aplikasi membutuhkan server-side secret boundary,
penanganan upload multipart, route API internal, dan halaman administrasi
dengan state server. React + TypeScript tetap sejalan dengan reference
implementation design system. Vite + React dapat dipakai bila organisasi
memilih backend terpisah, tetapi repository ini belum memiliki backend tersebut.

### 2.2 UI dan interaksi

- CSS variables dari design-system.md sebagai token utama.
- Tailwind CSS bersifat opsional dan tidak boleh menggantikan token.
- Radix Select atau primitive setara untuk select custom.
- lucide-react untuk icon.
- native HTML dialog atau primitive setara untuk dialog.
- ApexCharts melalui `apexcharts` dan `react-apexcharts` sebagai library chart
  resmi. Chart dibungkus dalam komponen `ReportChart` dan hanya menampilkan
  agregasi yang berasal dari response SISTER.
- React Hook Form dan Zod untuk form serta validasi.
- TanStack React Query melalui integrasi tRPC untuk cache query, loading state,
  dan mutation state pada client component.

### 2.3 Internal API: tRPC

- Gunakan `@trpc/server`, `@trpc/client`, dan
  `@trpc/tanstack-react-query` bersama `@tanstack/react-query`.
- Root router menggabungkan router per module, misalnya `pegawaiRouter`.
- Procedure diberi nama berdasarkan capability, misalnya `pegawai.search`,
  `pegawai.get_detail`, `pegawai.get_bkd`, atau `pegawai.update_data`.
- Query dan mutation tRPC hanya menerima input yang divalidasi Zod.
- Router memeriksa session dan permission lalu mendelegasikan pekerjaan ke
  service/use case; router tidak memanggil Prisma atau SISTER secara langsung.
- Output tRPC berupa DTO yang aman untuk UI, bukan object Prisma mentah atau
  response external yang mengandung secret.
- Transport JSON memakai `app/api/trpc/[trpc]/route.ts`.
- Upload multipart dan download binary memakai Route Handler khusus karena
  kebutuhan file external system tidak sama dengan kontrak JSON tRPC.

### 2.4 Kontrak external API

- YAML/OpenAPI resmi external system menjadi input utama pembuatan tipe.
- Tipe dapat dihasilkan dengan openapi-typescript.
- Client external dapat memakai fetch wrapper typed atau openapi-fetch.
- Payload yang belum memiliki kontrak YAML tidak boleh ditebak dari nama field
  UI.
- `ReportChart` harus berupa client component; pada Next.js, muat
  `react-apexcharts` secara client-only bila diperlukan untuk menghindari
  ketergantungan `window` pada server render.

### 2.5 Infrastruktur tambahan

- Redis belum wajib untuk satu instance server.
- Redis dapat ditambahkan untuk cache token/query bila aplikasi berjalan
  multi-instance.
- Reverse proxy harus menyediakan HTTPS.
- Secret manager atau environment secret dipakai untuk credential.
- Structured logging wajib melakukan redaction.

## 3. Diagram konteks

    User Browser
          |
          v
    Next.js UI and internal API
          |
          +--> Local Auth and RBAC
          |
          +--> Application Use Cases
          |       |
          |       +--> SISTER Client
          |       |       |
          |       |       +--> Token Provider -> POST /authorize
          |       |       +--> Typed endpoint adapters
          |       |
          |       +--> PostgreSQL metadata, cache, audit
          |
          v
    SISTER Web Service instance PT

Browser hanya mengetahui session aplikasi dan response yang sudah dipilih oleh
BFF. Browser tidak menerima credential API atau bearer token SISTER.

## 4. Batas modul aplikasi

Struktur portable yang disarankan:

    src/
      app/
        (public)/
        (authenticated)/
          <module>/page.tsx
        api/
          trpc/[trpc]/route.ts
          <module>/<file-capability>/route.ts
      modules/
        <module>/
          page/
          api/
          widget/
          repository/
          schema/
          type/
      component/
        ui/
        widget/
      const/
        theme.ts
      server/
        trpc/
        sister/
        auth/
        db/
        observability/
      hook/
    prisma/
    tests/
      unit/
      contract/
      integration/
      browser/

Mapping untuk project `sister-integrated`:

    src/app/(authenticated)/pegawai/page.tsx
      -> src/modules/pegawai/page/pegawai_page.tsx
      -> src/modules/pegawai/api/pegawai_router.ts
      -> src/modules/pegawai/api/pegawai_service.ts
      -> src/modules/pegawai/api/pegawai_adapter.ts
      -> src/modules/pegawai/repository/pegawai_cache_repository.ts (optional)

    src/app/referensi/page.tsx
      -> src/modules/referensi/page/referensi_page.tsx
      -> src/modules/referensi/api/referensi_router.ts
      -> src/modules/referensi/api/referensi_service.ts
      -> src/modules/referensi/api/referensi_adapter.ts
      -> src/modules/referensi/schema/referensi_schemas.ts

    src/app/bkd/page.tsx
      -> src/modules/bkd/page/bkd_page.tsx
      -> src/modules/bkd/api/bkd_router.ts
      -> src/modules/bkd/api/bkd_service.ts
      -> src/modules/bkd/api/bkd_adapter.ts
      -> src/modules/bkd/widget/bkd_workspace_widget.tsx

    src/app/penugasan/page.tsx
      -> src/modules/penugasan/page/penugasan_page.tsx
      -> src/modules/penugasan/api/penugasan_router.ts
      -> src/modules/penugasan/api/penugasan_service.ts
      -> src/modules/penugasan/api/penugasan_adapter.ts
      -> src/modules/penugasan/widget/penugasan_workspace_widget.tsx
      -> src/app/penugasan/[id_penugasan]/page.tsx (route detail)

    src/app/pendidikan_formal/page.tsx
      -> src/modules/pendidikan_formal/page/pendidikan_formal_page.tsx
      -> src/modules/pendidikan_formal/api/pendidikan_formal_router.ts
      -> src/modules/pendidikan_formal/api/pendidikan_formal_service.ts
      -> src/modules/pendidikan_formal/api/pendidikan_formal_adapter.ts
      -> src/modules/pendidikan_formal/widget/pendidikan_formal_workspace_widget.tsx
      -> src/app/pendidikan_formal/[id_pendidikan_formal]/page.tsx (route detail)

    src/app/riwayat_pekerjaan/page.tsx
      -> src/modules/riwayat_pekerjaan/page/riwayat_pekerjaan_page.tsx
      -> src/modules/riwayat_pekerjaan/api/riwayat_pekerjaan_router.ts
      -> src/modules/riwayat_pekerjaan/api/riwayat_pekerjaan_service.ts
      -> src/modules/riwayat_pekerjaan/api/riwayat_pekerjaan_adapter.ts
      -> src/modules/riwayat_pekerjaan/widget/riwayat_pekerjaan_workspace_widget.tsx
      -> src/app/riwayat_pekerjaan/[id_riwayat_pekerjaan]/page.tsx (route detail)

Aturan folder:

1. Folder `app/` hanya berisi route entry Next.js, loading/error boundary, dan
   transport handler yang memang diwajibkan framework.
2. Semua kode khusus module berada di `modules/<module>/`. Subfolder `page/`,
   `api/`, `widget/`, `repository/`, `schema/`, dan `type/` hanya dibuat bila
   memang dibutuhkan.
3. `component/ui/` hanya berisi primitive lintas module: button, form, modal,
   status, dropdown, date picker, breadcrumb, sidebar, toast, tabs, state, dan
   pagination.
4. `component/widget/` hanya berisi composite UI generik lintas module. Widget
   yang memahami domain tertentu tetap berada di `<module>/widget/`.
5. `const/theme.ts` menjadi tempat nilai warna, font, dan konfigurasi visual
   bersama. Domain constant tetap berada di module terkait.
6. `server/sister/` menyimpan client/auth/transport umum external system;
   adapter domain tetap dapat berada di module agar pencarian kode tetap mudah.
7. File route entry boleh tipis dan mengimpor page dari module. Ini adalah
   pengecualian teknis Next.js, bukan penyebaran business logic.

Aturan layout project:

- Header aplikasi memakai padding horizontal 40px dan hanya berisi search global
  serta profil/user menu di kanan.
- Breadcrumb tidak berada di header; breadcrumb berada di body halaman pada row
  pertama bersama action/filter/search halaman.
- Breadcrumb maksimal 3 level. Halaman detail memakai pola icon grid, tiga dot,
  lalu `Detail <nama data>`.
- Halaman tidak menampilkan title/deskripsi visual bila nama halaman sudah
  jelas dari breadcrumb.
- Filter dropdown, date picker, search halaman, dan button aksi halaman berada
  di kanan breadcrumb, bukan di dalam card form.
- Gunakan custom select dan custom date picker dari `component/ui/`; jangan
  memakai native `<select>` atau tampilan date input browser sebagai UI final.
- Jangan membuat card di dalam card. Form dan filter berdiri sendiri; card
  hanya untuk satu unit informasi, table shell, dialog, atau state penting.

Gunakan nama folder dan file lowercase dengan underscore bila nama terdiri dari
beberapa kata, kecuali nama file khusus framework seperti `page.tsx`,
`route.ts`, `loading.tsx`, dan `error.tsx`.

### 4.1 UI layer

UI hanya menyusun breadcrumb row, table, form, tabs, dialog, badge, state, widget,
dan route. UI tidak membangun header Authorization dan tidak mengetahui cara
refresh token. Component dan widget tidak boleh mengimpor adapter SISTER atau
Prisma.

### 4.2 Use-case layer

Use case mengatur:

- permission user lokal;
- validasi input;
- urutan pemanggilan endpoint;
- interpretasi response 200/204;
- pencatatan operasi;
- status ajuan;
- rekonsiliasi.

Contoh use case:

- SearchSdm;
- GetSdmOverview;
- GetBkdBySemester;
- GetReferenceOptions;
- CreateSisterRecord;
- UpdateSisterRecord;
- DeleteSisterRecord;
- UploadAndAttachDocument;
- GetSubmissionStatus;
- ReconcileOperation.

### 4.3 SISTER adapter

Adapter dibagi menjadi:

- auth adapter untuk POST /authorize;
- reference adapter;
- sdm adapter untuk data pokok;
- bkd adapter;
- portfolio adapter untuk penelitian, pengabdian, publikasi, dan lain-lain;
- document adapter;
- submission adapter untuk endpoint /ajuan;
- error adapter.

Setiap adapter hanya mengekspos endpoint yang sudah dipilih untuk product
scope. Penambahan endpoint harus mengubah schema, PRD, dan TODO secara
bersamaan.

## 5. Internal API boundary

Untuk project `sister-integrated`, BFF JSON menggunakan satu transport tRPC:

    app/api/trpc/[trpc]/route.ts
      -> rootRouter
      -> router module
      -> procedure
      -> service/use case
      -> SISTER adapter atau Prisma repository

Capability tRPC yang disiapkan untuk MVP, bukan daftar final seluruh endpoint:

    pegawai.search          query
    pegawai.get_overview    query
    pegawai.get_profile     query
    pegawai.get_bkd         query
    referensi.get_profil_pt query
    referensi.get_semester  query
    bkd.laporan_akhir       query
    bkd.pendidikan          query
    bkd.ajar                query
    bkd.tunjang             query
    bkd.pengmas             query
    bkd.penelitian          query
    penugasan.list          query
    penugasan.get_detail    query
    pendidikan_formal.list       query
    pendidikan_formal.get_detail query
    riwayat_pekerjaan.list       query
    riwayat_pekerjaan.get_detail query
    operation.get           query
    submission.get_status   query
    pegawai.update_data     mutation

Nama procedure mengikuti capability UI, bukan menyalin otomatis 1:1 dari 236
endpoint SISTER. Procedure internal harus:

- memvalidasi input;
- memeriksa permission;
- membatasi integration context;
- menormalisasi error ke bentuk UI;
- mencatat operasi bila diperlukan;
- tidak mengembalikan token atau credential.

Router tidak boleh berisi query SQL, detail header SISTER, atau urutan workflow
yang kompleks. Logic tersebut berada di service/use case agar dapat diuji tanpa
transport tRPC.

### 5.1 Route handler file

Upload multipart dan download binary tidak dipaksa melalui procedure JSON tRPC.
Gunakan Route Handler capability yang eksplisit, misalnya:

    app/api/pegawai/dokumen/route.ts

Handler file tetap memanggil service module yang sama, memeriksa session dan
permission, serta tidak mengembalikan token SISTER. Jangan membuat generic route
seperti `/api/proxy?path=...` karena dapat membuka SSRF, melewati permission,
dan mengekspos endpoint yang belum disetujui.

## 6. Alur autentikasi

Ada dua lapisan autentikasi:

1. Auth user ke aplikasi kita.
2. Auth server ke SISTER melalui POST /authorize.

SSO pada website publik SISTER tidak boleh diasumsikan sebagai OAuth/OIDC untuk
aplikasi baru. Dukungan SSO eksternal adalah keputusan terpisah yang harus
memiliki dokumentasi resmi.

Alur request:

    User login aplikasi
      -> local session
      -> permission check
      -> tRPC context dan procedure
      -> use case membutuhkan external system
      -> token provider cek token memory/cache
      -> jika kosong atau expired, POST /authorize
      -> simpan token sementara dengan TTL
      -> panggil endpoint external system

Credential username, password, dan id_pengguna disimpan sebagai secret
reference. Token tidak disimpan di localStorage dan tidak ditulis ke log.

## 7. Alur read

    Browser
      -> tRPC query
      -> tRPC context dan permission check
      -> module service/use case
      -> external adapter
      -> token provider
      -> GET external system
      -> parse response sesuai schema endpoint
      -> optional cache
      -> response UI

Aturan read:

- identifier parent harus berasal dari hasil query/reference yang sah;
- parameter filter harus berasal dari reference yang sah bila external system
  menyediakannya;
- referensi bertingkat dimuat sesuai parent ID;
- response array kosong adalah empty state, bukan error;
- cache diberi timestamp dan status stale;
- data sensitif detail tidak dicache kecuali ada alasan produk yang disetujui.

Pada `sister-integrated`, `sister_sdm_index_cache` hanya menyimpan field ringkas
yang berasal dari response `/referensi/sdm`. Cache live bersifat write-through
setelah pembacaan SISTER dan dapat dipakai untuk lookup summary berdasarkan
`integration_id` + `id_sdm` selama umur cache masih valid. Jika cache kosong,
stale, atau gagal ditulis, service kembali ke adapter SISTER; cache tidak boleh
menyamarkan data stale sebagai response live. Profil dan kepegawaian detail
belum dicache.

Untuk project `sister-integrated`, `id_sdm` berasal dari `/referensi/sdm` dan
`id_smt` berasal dari `/referensi/semester`.

Read-only reference flow yang sudah diimplementasikan:

    `/referensi/profil_pt` -> ReferensiDataSource.getProfilPt()
    `/referensi/semester` -> ReferensiDataSource.getSemester()
    `/referensi/wilayah` -> ReferensiDataSource.getWilayah(id_level_wilayah)
    `/referensi/perguruan_tinggi` -> ReferensiDataSource.getPerguruanTinggi()
    `/referensi/unit_kerja` -> ReferensiDataSource.getUnitKerja(id_perguruan_tinggi)

`profil_pt`, `semester`, dan `perguruan_tinggi` tidak menerima query dari
browser, diparse sebagai array sesuai kontrak PDF, lalu dipetakan menjadi DTO
eksplisit. `wilayah` dan `unit_kerja` adalah referensi bertingkat, tetapi
dengan mekanisme filter yang berbeda: `wilayah` hanya menerima
`id_level_wilayah` (0-3) dari SISTER, sehingga hubungan parent/child
(`id_induk_wilayah`) difilter di widget berdasarkan level yang sudah dipilih
pengguna; `unit_kerja` benar-benar difilter oleh SISTER lewat query
`id_perguruan_tinggi`, sehingga UI hanya perlu memilih perguruan tinggi lebih
dulu (dari `/referensi/perguruan_tinggi`) lalu mengirim ID itu sebagai query,
tanpa filter tambahan di client. Fixture dan live adapter memiliki interface
yang sama. Implementasi awal belum menulis reference cache karena response
belum dibutuhkan lintas request sebagai persistence; cache portable dapat
ditambahkan setelah TTL dan minimisasi data ditetapkan.

Modul BKD mengikuti alur referensi tersebut. UI tidak menerima UUID atau
semester arbitrary dari user; user memilih SDM dan semester dari hasil query
referensi. Laporan akhir dipanggil dengan `id_sdm`, sedangkan lima tab aktivitas
dipanggil dengan `id_sdm` dan `id_smt`. Tab aktivitas dimuat satu per satu agar
halaman tidak mengirim lima request aktivitas sekaligus. Semua procedure BKD
adalah protected query dan tidak menyediakan mutation.

Modul Penugasan memakai `id_sdm` hasil pilihan `/referensi/sdm` untuk list.
Detail memakai ID penugasan yang berasal dari list dan divalidasi ulang sebagai
UUID di procedure. List serta detail memiliki adapter dan DTO terpisah sesuai
response PDF; tidak ada path arbitrary dan tidak ada cache lokal pada slice
awal.

Modul Pendidikan Formal memakai `id_sdm` hasil pilihan `/referensi/sdm` untuk
list. Detail memakai ID pendidikan formal dari hasil list dan divalidasi ulang
sebagai UUID di procedure. Schema list dan detail terpisah karena tipe
`jenis_ajuan` pada PDF berbeda; detail hanya menampilkan metadata dokumen dan
belum menyediakan binary download, cache, atau mutation.

Modul Riwayat Pekerjaan memakai `id_sdm` hasil pilihan `/referensi/sdm` untuk
list. Detail memakai ID riwayat pekerjaan dari hasil list dan divalidasi ulang
sebagai UUID di procedure. Slice ini hanya membuka GET list/detail sesuai PDF
halaman 260-263; dokumen hanya ditampilkan sebagai metadata, tanpa binary
download, cache, atau mutation.

## 8. Alur write dan update penuh

Untuk create:

    Form
      -> Zod validation
      -> tRPC mutation
      -> permission check
      -> optional upload document
      -> POST resource external system
      -> record operation
      -> show ID atau status ajuan
      -> re-fetch detail/list

Untuk update:

    Form
      -> tRPC query detail lengkap
      -> merge perubahan yang valid
      -> pertahankan semua field wajib dan dokumen lama
      -> tRPC mutation
      -> PUT full payload external system
      -> record operation
      -> re-fetch detail/list

PUT tidak boleh memakai payload partial hanya karena form hanya menampilkan
sebagian field. Field yang tidak ditampilkan harus berasal dari detail SISTER
atau strategi schema yang telah diverifikasi.

## 9. Alur dokumen

External API dapat memisahkan dokumen dari data utama. Pada project
`sister-integrated`, API SISTER memang menggunakan pola berikut:

    file or link
      -> POST /dokumen
      -> external document ID
      -> attach ID to resource payload
      -> tRPC mutation atau file Route Handler
      -> POST or PUT resource

Jika upload berhasil tetapi resource gagal:

- catat document ID dan operasi terkait;
- tandai operasi sebagai FAILED atau NEEDS_REVIEW;
- jangan menghapus dokumen secara otomatis tanpa aturan kompensasi yang jelas;
- sediakan pemeriksaan atau cleanup yang dikonfirmasi operator.

Untuk kelas kuliah, dokumen berupa tautan dan endpoint memiliki aturan bahwa
kelas harus diselenggarakan oleh PT pemilik token.

## 10. Alur WS-BASIC dan WS-PRO

UI membaca role dari hasil authorize dan menampilkan mode integrasi:

| Mode | UX yang benar |
| --- | --- |
| WS-BASIC | aksi berlabel ajukan, response 204 tidak dianggap final |
| WS-PRO | aksi dapat berlabel simpan/perbarui, tetap validasi response |
| role tidak dikenal | blok mutation sampai konfigurasi dikonfirmasi |

Untuk WS-BASIC, aplikasi membaca endpoint ajuan terkait. Status ajuan harus
ditampilkan sebagai teks, bukan warna saja. Ajuan berstatus Draft, Diajukan,
Disetujui, Ditolak, dan Ditangguhkan tidak boleh dicampur sebagai data master
yang sudah final.

## 11. Error handling dan reliability

### 11.1 Mapping error

| Kondisi | Tindakan |
| --- | --- |
| 400 | tampilkan detail validasi dekat field atau form |
| 401 pada read | refresh auth sekali untuk request berikutnya, lalu minta admin memperbaiki credential bila tetap gagal |
| 401 setelah write dikirim | jangan mengulang buta; cek operasi dan data external |
| 403 | tampilkan tidak berwenang atau role tidak cukup |
| 404 | tampilkan data/endpoint tidak ditemukan |
| 405 | sembunyikan mutation pada resource read-only |
| 409 | tampilkan konflik dan lakukan rekonsiliasi |
| 500 atau network timeout | tandai gagal atau NEEDS_REVIEW sesuai kepastian hasil |

GET dapat memiliki retry bounded setelah timeout bila aman. POST, PUT, dan
DELETE tidak boleh di-retry otomatis bila request mungkin sudah diterima
SISTER. Tidak adanya response bukan bukti bahwa mutation tidak terjadi.

### 11.2 Idempotensi lokal

SISTER PDF tidak mendokumentasikan idempotency key universal. Aplikasi membuat
request fingerprint lokal dari integration, method, path, resource ID, dan
payload canonical. Fingerprint dipakai untuk mendeteksi pengiriman ulang dan
rekonsiliasi, bukan dikirim sebagai kontrak yang belum didukung SISTER.

## 12. Data ownership dan keamanan

- SISTER memiliki data master.
- User aplikasi memiliki session dan permission lokal.
- Aplikasi memiliki audit operasi, bukan hak untuk mengubah sejarah SISTER.
- Log tidak boleh berisi password, bearer token, file binary, NIK, NPWP,
  alamat, atau payload PII penuh.
- Detail sensitif dibatasi berdasarkan role lokal.
- Semua koneksi produksi memakai HTTPS.
- Upload harus divalidasi MIME, ukuran, dan extension setelah aturan resmi
  SISTER dikonfirmasi.
- Database backup harus terenkripsi dan memiliki kebijakan retensi.

Detail security invariant, threat model, dan audit program berada pada
[security.md](./security.md). Architecture security boundary-nya adalah:

| Layer | Kontrol wajib | Owner |
| --- | --- | --- |
| Browser/UI | tidak ada token, PII minim, safe rendering, safe link, state permission | component/page |
| Next.js/tRPC | schema input/output, auth context, CSRF/CORS, rate/body limit, error redaction | route/context |
| Authentication | Secure/HttpOnly/SameSite cookie, timeout, rotation, revocation | auth service |
| Authorization | role lokal, operation, resource, `id_sdm`, integration/PT, external role | procedure/use case |
| Use case | urutan workflow, full PUT, audit, no blind retry, fail closed | module service |
| SISTER adapter | allowlisted base URL, safe outbound, bearer header server-only, response validation | `server/sister` dan adapter module |
| Prisma/PostgreSQL | `snake_case`, parameterized query, DB least privilege, constraint, backup | repository/ops |
| File | size/type/content validation, random storage key, ownership, safe download | file route/service |
| Logging/audit | redaction, correlation ID, `sister_operation`, `security_audit_event` | observability |
| Deployment/CI | HTTPS, security headers, secret injection, dependency/secret scan, restore test | platform/release |

Tidak ada satu layer yang boleh dianggap menggantikan layer lain. UI check
adalah bantuan UX; authorization server tetap wajib. Proxy allowlist tidak
menggantikan validasi URL, dan audit event tidak menggantikan pencegahan akses.

### 12.1 Audit event dan operation audit

`sister_operation` mencatat request bisnis/integrasi dan status rekonsiliasi.
`security_audit_event` mencatat login, logout, authorization denied, CSRF,
rate limit, input/file rejection, secret failure, perubahan role/permission,
perubahan integration, dan indikasi SSRF/anomali. Keduanya memakai correlation
ID dan redaction, tetapi hak baca dan retention security audit lebih ketat.

Audit security hanya dianggap aktif bila event benar-benar dibuat, dapat dibaca
oleh owner terbatas, perubahan/penghapusan terdeteksi, dan event penting dapat
dipakai untuk alert atau investigation. Keberadaan tabel saja bukan evidence
bahwa kontrol audit sudah berjalan.

## 13. Deployment topology

Untuk MVP satu instance:

    HTTPS reverse proxy
      -> Next.js Node process
      -> PostgreSQL
      -> SISTER instance PT

Redis hanya ditambahkan bila kebutuhan multi-instance, distributed token cache,
atau job queue sudah terbukti. Queue tidak menjadi alasan untuk membuat bulk
sync yang belum ada di PRD.

Konfigurasi minimum yang diharapkan:

- base URL SISTER;
- API version;
- secret reference credential;
- expected external role;
- database URL;
- session secret;
- timeout yang disetujui;
- environment name.

Nilai credential aktual tidak boleh dimasukkan ke repository.

## 14. Testing architecture

### Unit

Uji:

- payload date yyyy-mm-dd;
- optional null/0/array;
- full PUT payload;
- preservasi dokumen;
- mapping role;
- mapping status HTTP;
- fingerprint operasi;
- parsing response 200 dan 204;
- redaction log dan security event;
- permission matrix serta fail-closed behavior;
- security header dan safe URL/file handling.

### Contract

Gunakan YAML resmi untuk memeriksa:

- path dan method;
- required field;
- enum;
- tipe response;
- multipart/binary;
- query parameter.

Uji procedure tRPC secara terpisah dari adapter external. Pastikan procedure
tidak dapat dipanggil tanpa session atau permission yang sesuai dan outputnya
tidak membocorkan response mentah yang sensitif.

### Integration/UAT

Gunakan credential dan data uji instance PT. Uji minimal:

- authorize dan expiry 60 menit;
- pencarian SDM;
- satu read detail;
- satu list BKD;
- satu referensi bertingkat;
- satu create/update/delete atau ajuan sesuai role;
- upload dokumen;
- rekonsiliasi timeout/409.

### Browser

Validasi UI dengan design-system QA pada 1280, 1024, 390, dan 320 pixel,
light/dark, keyboard, dialog, select, tabel scroll, loading, empty, error,
permission, dan nama panjang.

### Security audit

Review dan uji minimal:

- unauthenticated, wrong-role, cross-user, dan cross-PT/integration access;
- IDOR pada route, tRPC procedure, document, dan operation ID;
- CSRF/CORS, rate limit, request size, malformed input, dan error disclosure;
- XSS/HTML rendering, injection, SSRF, open redirect, path traversal, dan file
  upload/download;
- secret/token presence pada bundle, network response, local storage, log,
  cache, error, dan database;
- Prisma migration, raw query, DB privilege, backup, restore, dan audit readback;
- dependency, container, CI secret, HTTPS, cookie, CSP, dan security headers.

Setiap hasil diberi evidence level dari `security.md` dan status `PASS`,
`PARTIAL`, `FAIL`, atau `UNVERIFIED`. Source/unit test lokal tidak boleh
dilaporkan sebagai production security acceptance.

Unit test lokal tidak boleh dilaporkan sebagai bukti bahwa instance SISTER
produksi menerima payload.

## 15. Batas yang tidak boleh dilewati

Arsitektur ini tidak mencakup:

- scraping halaman web SISTER;
- akses database internal SISTER;
- menyimpan credential di browser;
- menganggap SSO publik sebagai API OAuth tanpa dokumen;
- mengubah data yang dinyatakan read-only;
- membuat endpoint lokal yang tidak punya use case SISTER;
- bulk import atau sinkronisasi seluruh 236 endpoint tanpa kebutuhan;
- analytics yang mengarang metrik yang tidak tersedia dari API;
- OCR atau AI untuk mengisi data tanpa scope baru.

## 16. Adaptasi ke repository lain

Saat dokumen ini dipindahkan, AI atau developer berikutnya harus membaca
repository tujuan terlebih dahulu sebelum membuat kode. Urutan adaptasi:

1. Identifikasi framework, App Router/Pages Router, package manager/runner,
   runtime, database, dan pola authentication yang sudah ada.
2. Salin prinsip portable: module-first, shared component/widget, server-only
   secret boundary, explicit capability, dan database `snake_case`.
3. Ganti `Project Profile` dengan nama project, external system, module awal,
   role, endpoint, dan design token repository tujuan.
4. Pertahankan route entry framework yang wajib, tetapi letakkan business logic
   di folder module agar mudah dicari dan diuji.
5. Gunakan tRPC hanya bila frontend dan backend berada dalam boundary TypeScript
   yang sama atau memang membutuhkan typed internal API. Jika repository sudah
   memiliki kontrak API lain, adaptasikan boundary tanpa membuat dua sumber
   kebenaran.
6. Pisahkan transport file multipart/binary dari transport JSON bila external
   system memiliki kebutuhan tersebut.
7. Perbarui schema, PRD, dan TODO sebelum menambah domain baru.

Pada repository ini, hasil adaptasi final harus tetap mengacu pada SISTER PDF,
`schema.md`, `prd.md`, `todo.md`, dan `design-system.md` secara bersamaan.
