# Audit progres GET, menu, dan UI — 2026-10-26

## Checkpoint lanjutan — 2026-10-27

Sesi sebelumnya dilanjutkan dari `01a177c2-d7f2-726a-970d-781124002022`.
Bagian audit asli di bawah adalah baseline sebelum perbaikan, bukan status
runtime terbaru. Perubahan sesi sebelumnya masih berada di working tree.

Verifikasi ulang read-only database sandbox melalui `bun run sister:coverage`:

- 136.140 record aktif; 118 dari 135 template mempunyai record.
- 132 template mempunyai scope: 115 available, 10 empty, 3 waiting_for_parent,
  dan 7 partial_or_failed. Status available bukan klaim QA semua record.
- Full sync terakhir PARTIAL: 7.833 request, 14 error (2026-10-26).
- Retry perbaikan terakhir SUCCEEDED: 78 request, 302 record, nol error;
  keberhasilannya tidak menggantikan status full sync yang parsial.
- Lima scope referensi dan sembilan detail ajuan pendidikan masih mempunyai
  status tersimpan HTTP 500. Dokumen kelas masih memuat 74 scope historis 403;
  jangan melewati guard kepemilikan PT untuk mengejar coverage.
- Tiga template detail masih menunggu parent kosong. Lima GET live/file
  memerlukan verifikasi terpisah dan tidak dihitung sukses oleh bulk sync.

Quality gate saat melanjutkan: 358/358 test (55 file), typecheck dan lint lulus.
Log build akhir sesi sebelumnya menunjukkan `build_exit=0`, termasuk route
statis `/pendidikan_formal/ajuan`. Ini bukan QA browser atau bukti live baru.

Perbaikan tambahan sesi lanjutan: Jelajah live kini menolak hasil saat batas
20 halaman tercapai dengan halaman terakhir penuh, bukan mengembalikan hasil
terpotong seolah lengkap. Pesan mengarahkan pengguna ke halaman bisnis atau
Data Replika. Ditambahkan tes batas penuh dan halaman terakhir pendek.
Tidak ada full sync baru atau request upstream pada pemeriksaan checkpoint ini.

Lanjutan ownership file: route foto kini memerlukan SDM aktif pada integrasi
terkonfigurasi; unduh dokumen memerlukan record daftar `/dokumen` aktif dan
SDM pemilik yang juga aktif pada integrasi yang sama. ID asing, belum disync,
soft-deleted, atau tanpa SDM ditolak 404 sebelum request upstream. Kegagalan
lookup database mengembalikan 503 tanpa detail internal. Role guard tetap
berlaku, dan penolakan membership dicatat tanpa menyimpan ID asing di metadata.
Dokumen yang hanya muncul sebagai referensi nested belum cukup untuk akses;
sync daftar dokumen pemilik diperlukan. Ini sengaja fail-closed.

Evidence: 373/373 test pada 56 file, typecheck dan lint lulus. Smoke test
read-only pada database lokal membenarkan membership satu sampel SDM dan satu
dokumen serta penolakan dua UUID tak dikenal. Tidak ada file upstream diunduh.
Test repository memeriksa filter integration/endpoint/record aktif dan relasi
SDM; ini belum merupakan uji end-to-end dua tenant nyata atau audit keamanan
menyeluruh.

Lanjutan QA browser (Chrome headless, fixture OPERATOR pada port lokal terpisah):

- Ditemukan CSP dev memblokir runtime Webpack sehingga React tidak hydrate.
  Policy kini mengizinkan `unsafe-eval` hanya non-production; test memastikan
  production tetap melarangnya. `.env` dan kebijakan production tidak dilonggarkan.
- Ditemukan pagination panjang menyebabkan overflow horizontal pada mobile.
  Primitive pagination kini membungkus tombol dalam lebar container.
- Script `scripts/browser_ui_smoke.mjs` menggunakan Chrome DevTools tanpa
  dependency baru, profile terisolasi dan host localhost saja. Tidak mencetak
  isi tabel, nama atau ID SDM, credential, maupun payload personal.
- Terverifikasi halaman replika DUDI: halaman 1 → 2 → terakhir (1.734 pada
  ukuran 25), baris terakhir tidak kosong, next disabled pada akhir.
- Lebar 1280/1024/390/320: tidak ada overflow halaman, tema light/dark benar
  diterapkan, sidebar desktop terlihat; sidebar mobile mengunci scroll,
  menerima fokus, Tab/Shift+Tab berputar di dialog, Escape menutup dan fokus
  kembali ke trigger. Picker SDM lolos fokus opsi, Home/End, Escape/restore.
- Tidak ada uncaught exception pada smoke test akhir. Quality gate:
  375/375 test pada 56 file, typecheck, lint dan diff-check lulus.
- Build ulang sesi ini berhasil compile, lint/type validation dan generate
  19 halaman, tetapi command timeout 240 detik saat collect build traces;
  belum dihitung sebagai build akhir sukses. Log sukses sesi sebelumnya
  tetap evidence historis, bukan pengganti build perubahan terbaru.

Batas evidence browser: fixture OPERATOR + replika lokal, bukan akun ADMIN,
seluruh halaman bisnis, seluruh submenu/role, screen reader atau audit visual
manual. Tidak ada file upstream diunduh atau request sync baru.
Prioritas tersisa: browser QA ADMIN/deep link/seluruh modul, uji file end-to-end
lintas tenant/role, dan verifikasi terbatas endpoint upstream yang gagal.
Acceptance seluruh GET/UI tetap terbuka.

### Verifikasi lanjutan build dan upstream — 2026-10-27 02:40 UTC

Probe sandbox terbatas memeriksa kembali tepat 14 scope tersimpan HTTP 500:
sembilan detail `/pendidikan_formal/ajuan/{id}` (parent aktif diverifikasi)
dan lima scope referensi di atas. Authorize berhasil; seluruh 14 tetap HTTP 500.
Request berurutan dengan jeda satu detik, timeout 10 detik per request, tanpa
retry HTTP 500 atau request lintas PT. Tidak mencetak ID/payload dan tidak
mengubah record/scope/run database. Status tersimpan bukan timestamp probe.
Hasil ini memerlukan tindak lanjut pemilik SISTER, bukan perubahan ID/parameter
atau data kosong pengganti error.

Build produksi terbaru **lulus lengkap (`build_exit=0`)**, termasuk collect
build traces dan route statis Ajuan. Percobaan pertama sempat terkena EPERM
Windows saat Prisma generate berbagi DLL dengan proses probe; menjalankan build
setelah proses database selesai berhasil, tanpa perubahan dependency/config.
Jangan menjalankan Prisma generate bersamaan dengan proses yang memakai engine
Prisma pada Windows.

`scripts/production_boundary_smoke.mjs` lulus terhadap `next start` lokal:
login 200; enam halaman protected redirect 307 ke login dengan return URL;
empat request file (foto/dokumen, tanpa cookie dan cookie invalid) ditolak 401,
no-store, request ID tersedia, tidak ada detail internal. Header produksi
mengandung HSTS, nosniff, DENY dan CSP same-origin tanpa unsafe-eval; tidak ada
X-Powered-By. Tidak memakai akun atau mengunduh file. Ini bukan uji authenticated
ADMIN, role matrix lengkap, atau tenant nyata. Semua server uji dihentikan
setelah pemeriksaan.

### Verifikasi role dan relasi replika — 2026-10-27

Ditemukan detail teknis `/replika` belum membuktikan membership parent pada
list aktif dan masih mempercayai `source_value` dari browser sebagai fallback
ID kelas. Diperbaiki pada `replika_service.ts`:

- Query parent list memakai integration terkonfigurasi, item key, SDM bila
  dipilih, dan query varian referensi; item tak ditemukan ditolak sebelum
  detail/child dibaca. View list tetap mengecualikan soft-deleted record.
- ID relasi berasal dari detail tersimpan atau list tersimpan; schema dan
  widget tidak lagi mengirim/memakai `source_value` dari client.
- Filter item key SQL memakai parameter binding, diuji bersama tenant, SDM,
  scope varian dan pagination. Detail bersama tetap dapat dibaca sesudah
  membership list dibuktikan, tanpa memaksa metadata owner detail sama.
- Test mencakup parent hilang/asing, SDM tidak cocok, parent valid tanpa
  detail, ID kelas tersimpan vs forged, relasi kosong dan modul live-only.

Regression role melalui tRPC caller mencakup sembilan procedure bisnis:
modules, sdm, rows, detail, semesters, report, warnings, live_search, live_detail.
Tanpa sesi → UNAUTHORIZED; VIEWER/REVIEWER/OPERATOR → FORBIDDEN, tanpa memanggil
service/upstream. ADMIN diteruskan ke service stub. Live proxy tetap menolak
modul non-pencarian. Ini unit boundary dengan context sintetis, bukan login
browser ADMIN atau bukti semua DTO production sudah diaudit.

Smoke read-only database lokal: satu parent penelitian dan satu pengajaran
berhasil membaca section, UUID parent tak dikenal ditolak. Tidak mencetak ID,
payload personal atau memanggil upstream. Quality gate terbaru:
**430/430 test pada 58 file, typecheck, lint, production build lengkap lulus**.

### QA ADMIN terautentikasi — 2026-10-27

Script opt-in `scripts/browser_admin_smoke.mjs` dijalankan terhadap build
produksi lokal, Chrome headless dengan profile temp terisolasi, origin lokal
konsisten, dan replika lokal. Script membuat akun ADMIN unik + credential
berhash, login normal lewat better-auth, lalu menghapus user/account/session
pada `finally`; akun existing tidak diubah. Password/cookie hanya di memori,
isi tabel/ID personal tidak dicetak. Audit login/denial tetap dipertahankan.
Request browser ke route foto/file diblokir agar tidak mengunduh upstream.

Hasil nyata:

- Seluruh 101 target menu/workspace dibuka sebagai ADMIN pada desktop 1280px
  dan mobile 320px: sidebar mendapat active item, loading selesai, tidak ada
  overflow halaman. Empat halaman representatif juga diuji 1024/390px.
- Empat Ajuan deep link memilih menu Ajuan, bukan detail ber-ID `ajuan`.
- DUDI bisnis mencapai halaman 2.167, URL pagination/back/forward berfungsi,
  dan deep link halaman akhir masih berisi baris.
- Peringatan mencapai halaman scope 37 (ukuran 20) dengan baris, bukan
  terpotong pada 200 hasil. Status upstream tetap dibedakan dari HTTP tRPC.
- Tidak ada uncaught browser exception atau respons error tRPC selama
  navigasi ADMIN. Ini tidak berarti semua scope upstream berhasil.
- Dengan cookie sesi nyata yang sama dan perubahan role hanya pada akun QA:
  `overview.session` mengikuti role database terbaru; `business.modules`
  hanya ADMIN; `replika.modules/rows` hanya ADMIN/OPERATOR. REVIEWER/VIEWER
  ditolak 403. Akun QA dinonaktifkan → session procedure dan file route
  ditolak 401 meski cookie sebelumnya masih dikirim.
- Cleanup terverifikasi: user, credential dan session akun uji dihapus;
  audit tetap tersimpan. Tidak ada data replika/SISTER yang dimutasi.

Batas tersisa: belum semua record detail/child/file, pencarian live dengan
keyword nyata, screenshot/visual manual, screen reader, atau dua integrasi
nyata. Matrix role sembilan procedure tetap unit test; sesi nyata mencakup
API representatif di atas, bukan seluruh procedure. Acceptance 39 modul dan
semua GET tetap terbuka. Quality gate source sebelumnya 430 test + build
produksi lulus; tambahan sesi ini adalah automation dan evidence QA.

### Detail/child QA dan perbaikan dashboard — 2026-10-27

QA diperluas dengan satu parent aktif dari tiap modul detail SDM, memakai
akun ADMIN sementara, build produksi lokal dan pemblokiran file upstream.
**35 modul populated** merender detail/section di 1280 dan 320px tanpa overflow
atau error tRPC/uncaught exception pada run akhir. `bimbing_dosen` dan
`pengujian_mahasiswa` tidak mempunyai sample parent aktif, sehingga tetap
untested; ini bukan keberhasilan detail kosong atau semua record.

Sample pengabdian dengan dua array >20 item menguji pagination independen:
anggota halaman 2 tidak mengubah dokumen halaman 1; setelah dokumen dipindah ke
halaman 2, keduanya bertahan pada deep-link reload 320px dengan baris tidak
kosong. Script diperlambat 2,5 detik per navigasi, menyediakan mode details-only
serta child-pages-only, dan menunggu kondisi DOM sebagai boolean agar CDP tidak
mencoba menserialisasi node. Rate limit production tetap tidak berubah.

Temuan aplikasi nyata: enam query agregat `replika_dashboard_repository.ts`
membandingkan kolom UUID dengan parameter text tanpa cast. PostgreSQL menolak
`uuid = text`; service dashboard men-degrade section menjadi null sehingga
HTTP 200 saja tidak membuktikan dashboard berfungsi. Ditambahkan `$1::uuid`
pada enam query dan enam regression test parameter binding.

Evidence perbaikan: smoke source/database menghasilkan 98 SDM, coverage tersedia,
tiga seri luaran, dan BKD tersedia. Smoke authenticated pada build produksi kini
mewajibkan semua section dashboard non-null dan lulus. Assertion baru mencegah
kesalahan SQL ini lolos sebagai halaman yang sekadar selesai loading.
**436 test pada 59 file, typecheck, lint dan build produksi lengkap lulus**.
Run browser detail-only terakhir juga lulus termasuk independent pagination.
Semua akun QA dibersihkan dan event audit dipertahankan.

Batas tersisa: pencarian/file live, seluruh record detail, dua parent kosong,
integrasi nyata kedua, visual manual dan screen reader. Acceptance seluruh GET
serta 39 modul tetap terbuka; 14 error upstream 500 belum berubah.

### QA binary file dan boundary integrasi — 2026-10-27

Dua temuan nyata diperbaiki:

1. `sisterGetFile` sebelumnya memanggil `arrayBuffer()` sebelum memeriksa
   ukuran aktual. Header panjang hilang/bohong bisa membuat buffer tak
   terbatas. Kini body dibaca per chunk, dibatalkan segera di atas 25 MiB,
   lalu dirakit hanya bila lolos. Response ditolak juga dibatalkan; regression
   test mencakup header hilang/understated, batas tepat, byte multichunk dan
   cancel. Tidak ada pelonggaran MIME, role, UUID, ownership atau size cap.
2. Pada server Next nyata, CSP global menimpa CSP sandbox dari Route Handler.
   `next.config.ts` kini mempunyai rule file setelah rule global agar seluruh
   `/api/sister/file/*` tetap `sandbox; default-src 'none'`. Test konfigurasi
   dan HTTP nyata memastikan policy tersebut benar pada response final.

Automation opt-in baru: `scripts/file_boundary_smoke.mjs`. Akun QA, sibling
integration disabled + record sintetis, dan record QA soft-deleted dibuat
lokal dan dibersihkan setelah run; tidak memodifikasi akun/record existing,
credential PT atau SISTER. Audit tidak dihapus.

Evidence sesi nyata: 16 request pada ADMIN/OPERATOR/REVIEWER/VIEWER membuktikan
foreign integration ID dan soft-deleted ID ditolak oleh membership lokal (404),
dokumen REVIEWER/VIEWER ditolak role (403). Penolakan tidak membocorkan keberadaan
resource asing. Ini sibling integration sintetis di DB lokal, bukan request
lintas PT nyata atau bypass otorisasi SISTER.

Server build produksi lokal dijalankan dengan upstream **di-override eksplisit
ke sandbox**. Dua sample lokal yang sah berhasil: foto image/jpeg (74.116 byte)
dan dokumen application/pdf (714.760 byte), keduanya HTTP 200, CSP sandbox,
nosniff, private/no-store, disposition inline/attachment sesuai jenis.
Tidak menyimpan binary, nama file atau payload ke disk/log; ID personal dan
credential tidak dicetak. Satu sample tiap jenis bukan bukti semua file sukses.
Smoke unauthenticated produksi diulang dan lulus setelah perubahan CSP.

Quality gate terbaru: **442 test pada 60 file, typecheck, lint dan build
produksi lengkap lulus**. Seluruh data/akun/integrasi QA dibersihkan dan server
uji dihentikan. Pencarian keyword live dan error upstream 500 masih terbuka.

### Pencarian live dan program studi — 2026-10-27

Ditemukan selector bisnis program studi memakai seluruh unit kerja, sementara
server live menerima UUID prodi tanpa membuktikan membership pada PT sendiri.
Perbaikan:

- Procedure ADMIN-only `business.program_studies` membaca replika dengan scope
  PT, filter `id_jenis_unit=3` sebelum LIMIT/OFFSET/count, dan DTO option minimal
  (value/label). Jika scope PT belum ada, tidak membaca unit tanpa scope.
- Selector bisnis kini memakai procedure tersebut, bukan semua unit. Error
  ditampilkan eksplisit; pagination tetap server-side.
- `mahasiswa_pddikti` memvalidasi pilihan terhadap response unit kerja PT
  sendiri dan tipe 3 sebelum request pencarian. Unit asing/non-prodi/response
  ambigu ditolak; tidak mengganti PT atau meneruskan ID asing ke endpoint itu.
- Cache ID PT dipisahkan berdasarkan integration, base URL dan id_pengguna,
  sehingga hasil target/integrasi lama tidak dipakai pada konfigurasi baru.

Probe sandbox bounded, berurutan (jeda 1 detik, timeout 10 detik), total tujuh
request, tanpa DB write atau pencatatan search term/ID/payload:

| GET | Hasil sample |
| --- | --- |
| `/referensi/mahasiswa_pddikti` | HTTP 200, objek kosong; bukan bukti data mahasiswa tersedia |
| `/kolaborator_eksternal` | HTTP 200, array 1.916 hasil untuk satu kriteria; bukan seluruh populasi |
| `/kolaborator_eksternal/{id}` | HTTP 200, satu objek; ID hanya dari hasil pencarian sebelumnya |

Prodi tak dimiliki juga diuji: ditolak dengan **nol request mahasiswa** untuk
ID tersebut. Helper hanya membaca profil/unit PT sendiri. Script reproducible:
`scripts/sister_search_probe.ts`; default memakai keyword QA tanpa match,
kriteria kolaborator opsional dari env, tidak pernah memakai NIK untuk smoke.
Tidak ada payload hasil dicetak/disimpan atau data produksi upstream diakses.

Browser ADMIN pada build produksi lokal: selector menampilkan **13 option / 13
prodi**, sesuai replika, dan layout 1280/320px lulus. Dengan cookie sesi nyata,
procedure baru mengizinkan ADMIN dan menolak OPERATOR/REVIEWER/VIEWER. Akun QA
sementara dibersihkan; error/exception browser tidak ditemukan pada run akhir.
Unit role boundary kini mencakup **10 procedure bisnis**.

Quality gate terbaru: **457 test pada 61 file, typecheck, lint dan build
produksi lengkap lulus**. Sandbox student search tetap kosong, pengujian
production mahasiswa belum dilakukan, dan 14 upstream HTTP 500 tetap belum
terselesaikan. Sample semua jalur live/file bukan acceptance seluruh record.

### Review visual referensi dan navigasi — 2026-10-27

Enam screenshot nyata halaman `/referensi/agama` diperiksa: light/dark 1280px,
light/dark 320px, serta drawer mobile light/dark. Hanya tabel referensi agama
(non-personal) dan identitas akun QA sintetis yang terlihat; tidak membuka
record pegawai atau memuat file upstream. PNG berada di temp Windows,
`.../Temp/sister-visual-*.png`, bukan di repository.

Temuan dan perbaikan:

- Item aktif desktop sebelumnya berada di luar viewport sidebar panjang.
  Sidebar kini scroll item aktif ke area terlihat pada deep link/perubahan
  route dan transisi ke desktop, tanpa memindahkan fokus keyboard.
- Drawer mobile menampilkan dua ikon tutup. Trigger luar kini berada di bawah
  modal saat terbuka; header drawer dirapikan sehingga satu close control
  terlihat. Escape dan restore fokus ke trigger tetap terverifikasi.
- Form header sebelumnya placeholder tanpa action/filter. Sekarang ADMIN
  dapat mencari nama/NIDN/NIP melalui GET `/pegawai?search=...`; label menjelaskan
  scope pegawai dan form disembunyikan untuk role yang tidak dapat membaca
  direktori. Filter/search lokal halaman tetap terpisah.

Browser pada build produksi membuktikan form header menavigasi ke URL filter
pegawai dan menghasilkan state nol hasil untuk keyword QA; lalu memotret
referensi tanpa data personal. Screenshot sesudah perubahan menunjukkan
alignment/breadcrumb/toolbar, warna light/dark dan state selected/focus konsisten;
scroll horizontal tabel tetap lokal di mobile, bukan overflow halaman.
Tidak ada error tRPC atau uncaught exception pada run akhir. Ini review visual
satu halaman representatif, bukan semua modul, perangkat fisik atau screen reader.

Mode reproducible: `UI_SMOKE_VISUAL_ONLY=1` pada script ADMIN (tetap perlu
opt-in pembuatan akun dan Chrome profile terisolasi). Akun/session QA dihapus.
Quality gate: **462 test pada 62 file, typecheck, lint, build produksi lengkap
serta diff-check lulus**. Upstream 500 dan acceptance menyeluruh tetap terbuka.

### Keyboard tabs dan disabled state — 2026-10-27

Primitive Tabs ditemukan selalu memindai maju saat melewati tab disabled,
termasuk ArrowLeft/End. Akibatnya bisa memilih tab enabled yang salah.
`tab_navigation.ts` kini menghitung target roving focus sesuai arah: kiri/End
memindai mundur, kanan/Home maju, wrap dan skip disabled tetap berlaku.

Regression test mencakup batas disabled, beberapa disabled berurutan, wrap,
satu/semua tab disabled, daftar kosong, key lain dan index tak valid. Markup
Tabs juga diuji untuk satu tab stop aktif, disabled non-tabbable dan relasi
ARIA selected-tab ↔ tabpanel.

QA browser ADMIN pada build produksi lokal (`UI_SMOKE_TABS_ONLY=1`) lulus pada
BKD 320px: ArrowLeft/Right/Home/End mengubah tab aktif beserta fokus dan state
URL; sample SDM tanpa semester tersedia mempunyai lima activity tab disabled
dan keyboard tidak pernah memfokusinya. Tidak ada overflow/error tRPC/uncaught
exception. Tidak mengunduh file atau mencetak data sample personal.

**476 test pada 64 file, typecheck, lint dan build produksi lengkap lulus**.
Akun/session QA dihapus, audit dipertahankan. Ini keyboard + ARIA source test,
bukan sertifikasi screen reader, semua kontrol form, atau seluruh perangkat.

### Riwayat sync lengkap dan ketahanan URL pagination — 2026-10-27

`/replika/status` masih membatasi riwayat pada 20 run dan ringkasan non-200
pada 50 kelompok, tanpa navigasi/total. Link “Riwayat lengkap” belum benar
untuk dataset di atas batas itu. Kini kedua tabel memakai LIMIT/OFFSET + total,
filter integration wajib, urutan deterministik (tie-breaker run ID dan
endpoint/status/kode), dan page state URL independen.

- `sync_status` menerima input bounded dengan default untuk caller lama yang
  tidak mengirim input. Response menyertakan total run dan **total kelompok**
  endpoint/status/kode; ini bukan jumlah scope individual.
- Pilihan 10/20/50/100 baris, refresh eksplisit dan pagination yang mempunyai
  label navigasi berbeda. Ganti ukuran mereset kedua halaman. PARTIAL dijelaskan
  sebagai belum lengkap, tidak lagi dianggap normal/sukses. HTTP 404 tidak
  otomatis dilabel sebagai error pengambilan pada judul tabel ringkasan.
- Hook URL generik dipindah ke `src/hook/use-url-state.ts` dan tetap diekspor
  ulang oleh shared bisnis. State URL/back behavior tidak diduplikasi.
- Parser page bounded bersama kini dipakai pada status, direktori, profil,
  daftar modul, hasil search, report, warning dan kedua halaman BKD. URL berisi
  Infinity/fractional/negatif/terlalu besar fallback ke halaman 1; validasi API
  langsung tetap menolak input invalid. Batas halaman besar DUDI tetap didukung.

Evidence database read-only: 13 run dan 14 kelompok pada integrasi aktif;
ukuran 10 halaman kedua berisi 3 run dan 4 kelompok. Tidak menciptakan run
atau scope palsu untuk membuktikan pagination.

Browser authenticated ADMIN produksi lokal lulus: paging dua tabel independen,
Back/Forward, deep-link reload 320px dengan baris, perubahan page size, dan URL
invalid status/DUDI/warning pulih ke halaman 1. API status tanpa input tetap
memakai default 20; sesi ADMIN/OPERATOR diizinkan, REVIEWER/VIEWER ditolak.
Tidak ada error tRPC/uncaught exception; akun QA dibersihkan dan audit dipertahankan.

Quality gate: **497 test pada 65 file, typecheck, lint dan build produksi
lengkap lulus**. Acceptance data upstream tetap terbuka; perubahan ini tidak
melakukan sync atau memperbaiki 14 HTTP 500 dari SISTER.

### Isolasi cache saat logout/pergantian akun — 2026-10-27

Audit menemukan query client browser dipakai sepanjang navigasi SPA, tetapi
login/logout belum menghapus cache. Ditambahkan:

- Cancel → reset observer aktif → cancel → clear query/mutation cache.
  `clear()` saja tidak cukup untuk mengosongkan hasil pada observer yang masih
  mounted; regression test menggunakan QueryObserver asli membuktikan state
  lama hilang. Request lama yang selesai sesudah cancel tidak mengisi cache lagi.
- SessionCacheBoundary menahan children saat identitas sesi berubah sampai
  cache siap. Identitas meliputi user/session ID, role dan isActive, bukan token.
  Bereaksi pada perubahan yang diamati client sesi; bukan klaim revocation
  real-time tanpa notifikasi/refetch. Login/logout menyegarkan sesi eksplisit.
- Success/error/batch tRPC diberi `private, no-store, max-age=0`, Pragma/Expires,
  Vary Cookie dan request ID; fetch tRPC client juga memakai `cache: no-store`.
  Ini mencegah lapisan HTTP browser/proxy memutar ulang DTO lintas akun.
- Logout gagal tidak berpura-pura sukses/redirect; alert dan tombol dapat
  dipakai kembali. Login network failure juga melepas state submitting.
  Login page/input kini mengikuti token dark/light, bukan `bg-white`.
- Post-login `next` dinormalisasi dan menolak URL external, protocol-relative,
  backslash serta control/whitespace yang dapat mengubah interpretasi origin.
  Path/query/hash lokal tetap didukung dan mempunyai regression test.

Browser pada build produksi (`browser_session_smoke.mjs`) memakai dua akun QA
sementara, **tanpa reload dokumen** antara ADMIN logout dan VIEWER login.
Sample referensi non-personal diprime, lalu switch selesai dalam freshness
window cache 60 detik. VIEWER memperoleh permission denial, tanpa baris ADMIN
atau header search ADMIN; Back tidak memulihkan tabel lama. Marker dokumen
memastikan full reload tidak menutupi regression cache. Header transport
private/no-store diverifikasi pada sesi VIEWER.

Network sign-out dan sign-in sengaja diblokir pada test terpisah untuk memeriksa
pemulihan UI/error handling. Logout sukses menghapus baris sebelumnya dan form
password baru kosong. Login dark mode 320px tetap memakai surface token dan
contained. Selector test dibatasi ke **header** search; form pencarian lokal
pada halaman error tidak disalahartikan sebagai kontrol header ADMIN.

Quality gate: **525 test pada 69 file, typecheck, lint, build produksi lengkap,
smoke produksi unauthenticated, dan same-document session smoke lulus**.
Akun/credential/session QA dihapus; audit tetap disimpan. Tidak mengunduh file,
memanggil sync atau menulis payload ke disk. Cross-tab/browser/device session
revocation dan screen reader menyeluruh masih perlu QA terpisah. Dua profile
Chrome temp QA juga dihapus setelah browser dihentikan, agar cache/cookie
browser dari run sebelumnya tidak tertinggal; profile pribadi tidak disentuh.

### Logout lintas tab dan expiry idle — 2026-10-27

Client session sebelumnya memeriksa broadcast/focus, tetapi polling interval
bawaan nol dan belum ada deadline UI pada snapshot `expiresAt`. Kini boundary
menjadwalkan deadline sekali, memblokir children saat expiry diketahui, menghapus
cache dan merevalidasi sesi. Snapshot expiry invalid diperlakukan fail-closed.
Deadline lama dibatalkan saat sesi berubah/diperpanjang; deadline sangat panjang
diperiksa ulang agar tidak overflow timer browser. Tidak menambah polling tetap
atau mengubah expiry/update-age sesi server.

Helper parsing/scheduling diuji untuk Date/ISO, invalid snapshot, tepat deadline,
cancel, one-shot dan rentang timeout 32-bit. Render server dengan snapshot expired
tidak merender children private dan menyediakan aksi masuk kembali.

Automation `scripts/browser_expiry_smoke.mjs` memakai satu akun QA sementara:

- Dua tab memuat cache referensi non-personal sebagai ADMIN. Logout normal di
  tab pertama menyebabkan tab kedua menghapus tabel/header ADMIN lewat broadcast,
  tanpa tab kedua difokuskan ulang atau reload. Endpoint sesi tab kedua ditolak
  401; marker dokumen membuktikan tidak ada reload yang menutupi pemeriksaan.
- Sesi QA baru diprime, lalu **hanya deadline session milik akun QA** dipendekkan
  ke enam detik di database lokal. Request get-session QA diberi opsi builtin
  `disableRefresh=true` melalui CDP agar server tidak memperpanjang deadline uji.
  Tidak memalsukan cookie, response, identitas, expiry global atau actor existing.
- Response nyata short expiry teramati, cache masih tampil sebelum deadline,
  kemudian tanpa focus/navigasi/forced read di deadline cache hilang dan session
  direvalidasi sebagai anonymous. API sesi sesudahnya 401; dokumen tidak reload.
  Request file upstream diblokir dan tidak mencetak ID/session/payload personal.

Quality gate: **531 test pada 70 file, typecheck, lint, build produksi lengkap,
smoke cross-tab/expiry, same-document switch dan boundary produksi lulus**.
Akun/credential/session QA dihapus, audit dipertahankan. Ini evidence Chrome
headless lokal, bukan jaminan waktu absolut pada browser frozen, clock skew,
perangkat offline atau revocation lintas device. Authorization/expiry server
masih sumber kebenaran; timer client hanya defense UI/cache tambahan.

### Konsistensi report dan drill-down berlabel — 2026-10-27

Audit read-only baru `scripts/report_consistency.ts` memeriksa 64 kelompok
(6 komposisi SDM, 46 modul/tahun luaran, 12 semester/simpulan BKD), count sesuai
filter, first/last page dan key/owner sample. Hasil **85 halaman sample tanpa
issue**, termasuk 40 kelompok luaran dengan partisipasi lebih banyak dari
record unik. Ini bukan pembacaan seluruh halaman tengah atau sertifikasi
kebenaran bisnis payload upstream.

Perbaikan laporan:

- Drill-down luaran sebelumnya menampilkan UUID SDM tanpa judul/owner label.
  Query kini memproyeksikan judul dan nama sumber, dedup ID aktivitas sebelum
  pagination, memilih owner yang masih terindeks pada integrasi yang sama dan
  scope directory canonical; cached fetch terbaru dan key menjadi tie-breaker.
- Jika owner tidak tersedia, jumlah aktivitas tetap dipertahankan tetapi link
  detail tidak ditawarkan sebagai link yang seolah valid. Tidak mengarang judul
  atau owner dan tidak membaca owner dari integrasi lain.
- Baris BKD dipilih pada unit SDM unik yang sama dengan count, dengan urutan
  cached fetch/key deterministik, agar kemungkinan record sumber duplikat
  tidak membuat jumlah baris berbeda dari count. Ini representative cache,
  bukan pembuatan simpulan BKD atau klaim konflik sumber sudah diselesaikan.
- Copy sumber membedakan status non-200 dan subset HTTP 404; footer pagination
  report dapat wrap pada mobile. Judul external dirender sebagai teks; regression
  test memastikan string HTML tidak dieksekusi.

Browser authenticated ADMIN pada build produksi lokal: kelompok luaran shared
multi-page dipilih dari API, jumlah drill-down sama dengan agregat, label
Kegiatan/SDM sumber tampil tanpa UUID sebagai isi sel, link record membuka
detail yang sesuai. Halaman akhir **7** reachable dan deep link pada 320px.
Tabel alternatif grafik cocok persis dengan angka per modul/tahun API. BKD
count/rows cocok dan link sumber mempertahankan semester. Tidak ada error
atau exception browser. Tidak mengambil screenshot/payload personal, tidak
mengunduh file (diblokir), tidak mengubah replika atau memanggil upstream.

Audit database diulang sesudah perubahan: 64 kelompok/85 first-last pages,
tetap tanpa issue. **541 test pada 72 file, typecheck, lint dan build produksi
lengkap lulus**. Akun/session QA dan profile browser temp dibersihkan;
audit dipertahankan. Scope upstream 500 dan acceptance menyeluruh tetap terbuka.

### Ownership attachment di luar daftar Dokumen — 2026-10-27

Audit struktur cache menemukan 5.372 record dokumen kelas aktif tanpa satu pun
ID pada daftar `/dokumen`, serta 10.585 occurrence dokumen di array detail,
hanya 590 yang juga ada pada daftar tersebut. Angka occurrence bukan ID unik
atau jaminan semua parent masih valid. Guard sebelumnya hanya menerima daftar
Dokumen sehingga sebagian link attachment yang sah selalu mendapat 404 lokal.

`file_access_repository.ts` kini menerima tiga jalur bukti, bukan arbitrary ID:

- Daftar Dokumen aktif + SDM pada index canonical aktif (jalur semula).
- Array eksplisit `dokumen[].id` / `id_dokumen` di detail SDM allowlisted,
  dengan detail, parent list dan index SDM aktif pada integrasi yang sama;
  scope detail/list harus canonical dan sesuai metadata parent.
- Dokumen kelas aktif dengan teaching detail/list dan SDM aktif, scope canonical,
  serta `id_pt` sesuai satu profil PT canonical aktif. Jalur generik attachment
  tidak menerima teaching detail, sehingga array inline tidak melewati guard PT.

Semua query parameterized. ID parent/URL dari browser tidak dipakai sebagai
bukti; tidak mengikuti `tautan` arbitrary. Unknown/retired/foreign tetap deny,
error storage tetap 503. Role check dan otorisasi SISTER live tetap authoritative;
bukti cache tidak berarti binary upstream pasti tersedia.

QA real PostgreSQL memakai fixture dalam transaksi rollback, tanpa mengubah
record existing: positif attachment/id alias dan kelas own-PT; negatif foreign
integration (termasuk kelas yang mengklaim PT sama), foreign PT dengan array
inline, scope detail inkonsisten, profil PT ambigu, parent retired, field nested
non-dokumen dan SDM retired. Setelah rollback diverifikasi nol fixture tersisa.
Matrix real-session 4 role/16 penolakan dan smoke production anonymous tetap
lulus tanpa request binary upstream dalam mode default.

Probe sandbox opt-in dibatasi empat source sample, in-memory, tanpa log ID,
filename, credential atau payload: foto JPEG **74.116 byte / HTTP 200**,
dokumen metadata PDF **714.760 byte / HTTP 200**, attachment aktivitas yang tidak
ada di daftar Dokumen maupun kelas PDF **477.097 byte / HTTP 200**. Ini membuktikan
perbaikan pada attachment sah, bukan klaim seluruh occurrence sudah terunduh.
Sample kelas memiliki bukti ownership lokal tetapi request download upstream
mengembalikan **HTTP 400** (route gateway 502). Probe live melaporkan unavailable
dan exit 1, bukan sukses palsu. Tidak mencoba URL alternatif atau bypass. Penyebab
referensi/availability binary kelas belum dibuktikan; metadata kelas dan binary
adalah bukti berbeda. Tidak menyimpulkan seluruh dokumen kelas gagal dari satu
sample. Empat belas scope 500 sebelumnya tidak diprobe ulang pada langkah ini.

**544 test / 72 file, typecheck, lint dan build produksi lulus**. Audit report
ulang tetap 64 group/85 first-last pages tanpa issue. Server QA dihentikan;
akun QA, integrasi sibling dan scope file-QA diverifikasi masing-masing nol.
Audit dipertahankan; tidak ada file binary disimpan ke disk. Acceptance seluruh
GET/data tetap terbuka, termasuk error upstream binary sample tersebut.

### Feedback unduhan inline dan pembatalan — 2026-10-27

Link unduhan di detail bisnis dan replika kini memakai kontrol bersama, bukan
navigasi ke endpoint JSON saat download gagal. HTTP 401/403/404/429 dan kegagalan
SISTER mempunyai copy statis yang aman; body error upstream tidak dibaca atau
ditampilkan. Error memakai role alert dan aria-describedby ke tombol. Busy/
disabled mencegah klik ganda; retry tetap manual. Sukses hanya menyatakan
“Unduhan dimulai”, bukan mengklaim file selesai tersimpan.

Helper browser hanya GET same-origin dengan no-store, credentials same-origin,
redirect error dan deadline 90 detik. MIME/batas 25 MiB memakai policy murni
bersama server, tanpa import token/config/Prisma ke browser. Disposition harus
attachment; body dibatasi selama streaming, file kosong/JSON/HTML ditolak,
filename disanitasi. Tidak ada blob dalam query cache atau storage. Unmount
membatalkan fetch dan membersihkan object URL; late response tidak memicu save
setelah abort. Guard ownership, role dan keputusan upstream tidak diubah.

Browser produksi lokal authenticated: tombol yang telah dirender ADMIN menerima
403 nyata setelah hanya role akun QA diubah menjadi VIEWER; error inline tetap
pada halaman dan terkait tombol. Setelah role dipulihkan, network block memicu
copy koneksi pada retry di 320px tanpa overflow. Request berikutnya ditahan CDP
sebelum server; busy/disabled teramati, navigasi SPA meng-unmount kontrol dan
Network.loadingFailed membuktikan request dibatalkan. Tidak ada exception JS
atau tRPC error. Tidak ada binary upstream, file disimpan atau screenshot data
personal; browser download behavior deny dipakai sebagai pengaman QA. Mode ini
bukan verifikasi save-dialog native/happy-path filesystem atau expiry mid-stream.

**568 test / 74 file, typecheck, lint dan build produksi lulus**. Unit baru
mencakup byte preservation, safe status/network copy, MIME/disposition, oversize
header/stream + cancellation, abort, empty body dan filename. Matrix 4 role/16
penolakan, fixture ownership SQL rollback, dan production anonymous smoke tetap
lulus. Akun/sibling/scope QA dibersihkan dan server/profile dihentikan/dihapus;
audit dipertahankan. Error binary kelas HTTP 400 dan scope 500 sebelumnya tidak
diprobe ulang atau dianggap selesai oleh perubahan UI ini.

### Bukti Dokumen multi-owner atomik — 2026-10-27

Jalur metadata Dokumen sebelumnya memakai findFirst kemudian memeriksa index
SDM owner itu saja. Secara laten ini dapat menolak ID yang ada pada beberapa
scope bila owner pertama retired sementara owner lain masih aktif; dua query
juga tidak memakai snapshot yang sama. Sekarang SELECT EXISTS parameterized
memeriksa satu rantai metadata + index SDM aktif pada integrasi yang sama dalam
satu query. Scope metadata harus canonical sesuai id_sdm. Satu rantai valid
cukup; bukan izin bagi owner/record retired atau tenant lain.

Audit lokal read-only: **1.488 ID Dokumen, nol ID multi-owner dan nol kasus
campuran active/missing owner**. Jadi ini hardening dengan reproduksi sintetis,
bukan klaim masalah tersebut sedang terjadi pada data sandbox saat ini.
Satu sample metadata existing tetap lolos ownership tanpa request upstream.

Fixture PostgreSQL rollback menambahkan metadata bersama untuk owner retired
lebih dahulu dan owner aktif lain. Diperiksa allow bila ada owner valid, deny
setelah copy aktif retired, deny saat seluruh index owner retired, metadata
owner null/scope salah, metadata di sibling integration, dan metadata pada
integrasi aktif yang hanya mempunyai index owner pada sibling. Seluruh fixture
hilang setelah rollback; record existing tidak diubah. Jalur kelas/attachment
serta role check tetap dipertahankan.

**569 test / 74 file, typecheck, lint dan build produksi lulus**. Real-session
matrix 4 role/16 penolakan, seluruh fixture ownership SQL dan smoke anonymous
produksi lulus. Tidak ada binary upstream atau payload personal dicetak/disimpan.
Server QA dihentikan, akun/sibling/scope QA diverifikasi nol; audit dipertahankan.
Tidak memperbaiki atau memprobe ulang error upstream kelas/14 scope 500.

## Coverage GET dalam halaman status — 2026-10-30

Audit read-only `bun run sister:coverage` mengonfirmasi **136.140 record aktif**,
118 template mempunyai record, dan 132 mempunyai scope dari 135 template JSON.
Kondisi katalog: 115 available, 10 empty, 3 waiting_for_parent dan 7
partial_or_failed. Full sync terakhir tetap PARTIAL (7.833 request, 14 error).
Tidak ada sync, mutation replika atau request upstream pada pekerjaan ini.

Halaman `/replika/status` kini menyediakan tabel coverage 135 template dengan
filter kondisi data, record aktif, jumlah scope per HTTP dan waktu pemeriksaan
scope terakhir. Pagination mempunyai state URL `page_coverage` independen dari
riwayat run/kelompok scope; filter `coverage_status` mereset halaman coverage,
dan perubahan ukuran mereset ketiga pager. URL invalid memakai default aman;
halaman di luar hasil filter diklem agar data tetap dapat dijangkau.

Procedure `replika.coverage` hanya ADMIN/OPERATOR, memakai integrasi konfigurasi
server. Repository hanya membaca agregat scope dan record aktif melalui query
parameterized; tidak mengirim ID scope/SDM atau payload. Pengelompokan kondisi
sekarang dibagi dengan script CLI agar definisi status konsisten. Available
berarti ada cache, bukan seluruh record berhasil. Lima GET live/file tidak
dihitung sukses oleh coverage ini. Status 403 historis tetap terlihat dan
bukan alasan melewati guard lintas PT.

Evidence: **578 test / 76 file, typecheck dan lint lulus**. Ringkasan serta
seluruh baris endpoint CLI sebelum/sesudah refactor sama. `bun run build`
terhenti pada Prisma generate karena DLL Windows terkunci; tidak ada perubahan
schema/dependency, dan build langsung `node node_modules/next/dist/bin/next build`
**lulus lengkap**, termasuk collect traces. Jadi bukan klaim command build
wrapper telah lulus; lock proses lain tidak dipaksa dilepas.

QA authenticated produksi lokal, `UI_SMOKE_STATUS_ONLY=1`: ketiga pager
independen; halaman terakhir coverage (5 template pada ukuran 10) terjangkau,
filter tiga detail menunggu parent, Back/Forward dan URL invalid lulus. Pada
320px tidak ada overflow halaman/error tRPC/uncaught exception. Sesi nyata
ADMIN/OPERATOR mendapat 200 untuk coverage, REVIEWER/VIEWER mendapat 403.
Akun/credential/session QA dihapus, audit dipertahankan; server dan browser QA
dihentikan, profile Chrome temp dihapus. QA ini bukan seluruh modul/record atau
perbaikan 14 HTTP 500 maupun sample binary kelas yang sebelumnya gagal.
Acceptance seluruh GET/UI tetap terbuka.

## Audit baseline (sebelum perbaikan)

Baseline source: commit `83e0f2d` (`checkpoint update sidebar`).
Audit ini memeriksa source, query agregat database lokal, layanan baca bisnis,
dan request terbatas ke sandbox. Tidak ada full sync, migration, perubahan
source aplikasi, atau pengambilan massal file pada audit ini. Credential,
token, ID personal, dan payload personal tidak dicatat di dokumen ini.

## Ringkasan

Belum memenuhi acceptance “seluruh data yang dapat diakses sudah diambil dan
terlihat dengan benar di setiap halaman”. Coverage katalog bukan coverage
hasil fetch, resolusi route, ataupun QA browser.

| Bukti | Hasil |
| --- | --- |
| GET PDF terdaftar | 140 endpoint unik |
| Template JSON replika | 135 |
| Jalur lainnya | 2 binary; 3 GET pencarian/detail live |
| Katalog UI | 95 varian: 93 replika dan 2 formulir pencarian |
| Record replika aktif | 134.856 pada 118 template endpoint |
| SDM pada replika | 97 |
| Template dengan scope tercatat | 132 dari 135 |
| Status scope non-200 tersimpan | 74 HTTP 403; 14 HTTP 500 |
| Run terakhir tersimpan | PARTIAL, selesai 2026-09-30 08:10:07 UTC |
| View database lokal | 171; migration terbaru belum diterapkan |

## 1. GET upstream

Authorize sandbox berhasil HTTP 200. Kontrol `/referensi/agama` berhasil
HTTP 200. Seluruh 14 scope yang sebelumnya HTTP 500 dipanggil ulang secara
terbatas, berurutan, dengan jeda satu detik dan timeout per request. Semuanya
masih menjawab HTTP 500:

- `/referensi/jenis_bahan_ajar` — satu scope.
- `/referensi/media_publikasi` — satu scope.
- `/referensi/lembaga_sertifikasi` — satu scope.
- `/referensi/semester` — satu scope.
- `/referensi/kelompok_bidang?iptek=false` — satu scope; varian `true`
  mempunyai data lokal, jadi jangan menyebut seluruh endpoint ini gagal.
- `/pendidikan_formal/ajuan/{id}` — sembilan scope detail.

Pemeriksaan ulang ini tidak menulis scope atau run ke database. Tanggal dan
status tersimpan tetap merupakan hasil sync sebelumnya, bukan hasil audit ini.
Jangan mengganti error dengan data palsu atau melabelinya sebagai respons kosong.

74 scope HTTP 403 dokumen kelas merupakan status historis. Pemeriksaan sesi
sebelumnya mengaitkannya dengan kelas lintas PT; audit ini tidak mengulangi
request lintas PT. Sync saat ini memiliki guard kepemilikan PT.

Tiga template yang belum mempunyai scope adalah `/bimbing_dosen/{id}`,
`/pengujian_mahasiswa/{id}`, dan
`/pengujian_mahasiswa/{id}/bidang_ilmu`. Daftar induknya memiliki scope 200
untuk 97 SDM dengan nol item. Jangan mengarang ID untuk menguji detailnya;
statusnya adalah belum dapat diuji karena parent kosong, bukan terbukti sukses.

Dua route binary dan tiga GET pencarian/detail live belum diuji ulang dalam
audit ini. Tidak ada klaim seluruh record GET production sudah tersedia;
konfigurasi lokal yang dipakai audit memilih sandbox.

## 2. Database ke layanan bisnis

Seluruh 93 varian non-pencarian berhasil dipanggil melalui layanan bisnis
lokal. Profil diuji dengan satu SDM dari integrasi aktif; aktivitas dibaca
lintas SDM; referensi mengikuti varian query. Ini bukan QA setiap detail atau
browser dan bukan bukti setiap varian mempunyai data.

Lima daftar mempunyai record tetapi nol kolom bisnis pada view terpasang:

| Modul | Record daftar |
| --- | ---: |
| Jabatan struktural | 1 |
| Detasering | 1 |
| Ajuan nilai tes | 5 |
| Visiting scientist | 12 |
| Tunjangan | 2 |

Payload kelimanya memiliki field; masalahnya bukan GET kosong. Migration
`20261002115127_replica_views` ada di repository (174 view hasil generator),
tetapi belum ada pada `_prisma_migrations` lokal. Terapkan melalui workflow
migration setelah meninjau perubahan schema turunan dan dependency-nya;
jangan menghapus record replika atau menjalankan reset database.

## 3. Pemetaan menu dan route

Inventaris katalog mencakup seluruh 138 GET JSON; dua GET binary melalui route
file terpisah. Namun empat URL Ajuan bertabrakan dengan detail `/{id}`:

| URL menu | Salah terbaca sebagai |
| --- | --- |
| `/jabatan_fungsional/ajuan` | Detail jabatan fungsional, ID `ajuan` |
| `/pendidikan_formal/ajuan` | Detail pendidikan formal, ID `ajuan` |
| `/sertifikasi_dosen/ajuan` | Detail sertifikasi dosen, ID `ajuan` |
| `/nilai_tes/ajuan` | Detail nilai tes, ID `ajuan` |

Pada catch-all `src/app/[...segments]/page.tsx`, pencocokan list dan detail
bercampur dalam satu loop. Detail modul sebelumnya menang sebelum daftar
Ajuan diperiksa. Selain itu Next.js memilih route statis
`pendidikan_formal/[id_pendidikan_formal]` sebelum catch-all, sehingga
pendidikan formal juga membutuhkan route Ajuan eksplisit atau restrukturisasi
route. Mengubah urutan catch-all saja tidak menyelesaikan kasus tersebut.

Sidebar sudah mempunyai ikon parent, submenu teks, garis penghubung, serta
hover/selected hijau. Ini tidak membuktikan URL targetnya sudah benar.
Tambahkan regression test resolusi seluruh URL katalog, terutama Ajuan,
query varian referensi, dan deep link detail.

## 4. Pagination

Yang terverifikasi lewat query database/layanan:

- Daftar bisnis memakai LIMIT/OFFSET, count total, dan scope integrasi.
- DUDI: total 43.339; halaman 2.167 berisi 19 record pada ukuran 20.
- Direktori SDM: total 97; halaman 5 berisi 17 record pada ukuran 20.
- Source menyediakan pagination untuk daftar modul, referensi, laporan,
  bidang ilmu dan tabel turunan detail. Interaksi browser belum diuji.

Celah yang masih ada:

- Explorer `/replika` mengambil maksimal 5.000 record lalu pagination di
  browser. Akibatnya 38.339 record DUDI di luar batas tidak dapat dijangkau
  lewat explorer tersebut, walau halaman bisnis DUDI dapat menjangkaunya.
- Hasil pencarian live pada halaman bisnis dirender tanpa pagination.
- Pusat peringatan merender sampai 200 scope tanpa pagination; di atas 200
  hasil dipotong oleh service. Halaman status bukan pengganti daftar scope
  lengkap karena menampilkan agregat.
- Picker SDM hanya meminta halaman pertama, maksimal 100 hasil. Pencarian
  membantu tetapi bukan navigasi lengkap untuk kampus dengan >100 SDM.
- Pilihan semester BKD diturunkan dari satu halaman laporan, bukan query
  distinct semester seluruh dataset.
- Semua section turunan detail memakai satu parameter `page` bersama.
  Halaman section kecil dapat kosong ketika section lain berpindah halaman.
  `DataTable` menyembunyikan pagination saat rows kosong sehingga navigasi
  pulih perlu diperiksa.
- Sync dan live explorer mempunyai batas 200 halaman upstream. Sync belum
  menandai kasus batas tercapai dengan halaman penuh sebagai incomplete;
  jangan menyimpulkan pagination upstream pasti lengkap hanya dari status run.

## 5. UI dan verifikasi keamanan

Fondasi auth/role, query integrasi, validation dan route file tersedia, tetapi
belum merupakan bukti audit keamanan menyeluruh atau production readiness.

Temuan source:

- Select dan DatePicker masih menggunakan `bg-white`, tidak sepenuhnya
  mengikuti token surface untuk dark mode.
- Select custom belum menyediakan interaksi listbox lengkap (panah keyboard,
  Escape, hubungan kontrol/listbox dan pengelolaan fokus).
- DatePicker masih input teks bertema, bukan kalender custom; draft lokal
  belum diselaraskan bila nilai parent berubah.
- Filter pencarian sejumlah daftar masih di body, bukan action sejajar
  breadcrumb sesuai kontrak design-system.
- Membership file terhadap integrasi/SDM lokal belum ditegakkan di route file;
  perlindungan saat ini mengandalkan role, UUID dan otorisasi SISTER upstream.
  Tetap perlu audit ownership; jangan melonggarkan akses untuk mengejar coverage.

Belum dilakukan QA browser, keyboard, screen reader, responsive, light/dark,
semua detail, semua role, atau seluruh file.

## 6. Hasil quality gate

- `bun run typecheck`: lulus.
- `bun run lint`: lulus.
- Vitest dengan Node (`node node_modules/vitest/vitest.mjs run`):
  210 lulus, 5 gagal, total 215 test pada 52 file.
- Empat kegagalan replika berasal dari ekspektasi lama: tiga belum memasukkan
  integrationId dan satu mengharapkan validasi input sebelum penolakan role.
  Perbaiki test tanpa menghilangkan guard integrasi/role.
- Satu kegagalan arsitektur nyata: `overview_service.ts` mengimpor Prisma
  langsung, bukan melalui repository.
- `bun run test` juga gagal lebih luas (39 file gagal) akibat interop/mock
  ketika Vitest dipaksa memakai Bun oleh `bunfig.toml`. Bedakan masalah runner
  ini dari lima kegagalan yang tereproduksi pada Node.

## Urutan tindak lanjut

1. Benahi resolusi route Ajuan dan regression test semua target menu.
2. Review/terapkan migration view lokal; verifikasi kelima modul yang sudah
   mempunyai payload menampilkan kolom bisnis.
3. Pastikan retry child/follow scope yang gagal tidak ikut terlewati karena
   detail parent tidak berubah; tandai batas pagination upstream sebagai
   incomplete, bukan sukses. Full sync baru dilakukan dengan pacing dan
   ringkasan coverage yang membedakan kosong, blocked dan error.
4. Lengkapi pagination explorer, peringatan, pencarian, picker dan semester;
   uji seluruh halaman besar serta navigasi ulang ketika hasil kosong.
5. Benahi tema/aksesibilitas komponen, quality gate, lalu jalankan QA browser
   dengan akun uji tanpa mencatat credential atau payload personal.
6. Pantau/retry 14 scope 500 secara terbatas dan eskalasi ke pemilik SISTER
   jika tetap gagal; jangan mencoba melewati pembatasan lintas PT.

Acceptance 39 modul dan seluruh GET tetap terbuka. Dokumen ini merekam bukti
audit, bukan menyatakan temuan di atas sudah diperbaiki.
