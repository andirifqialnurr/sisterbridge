# SISTER Read-only Replica

Status: tahap 1 (GET saja), diverifikasi terhadap sandbox dan production
SISTER pada 2026-09-29.

## Keputusan

Tahap pertama proyek hanya membaca data SISTER dan menyalinnya ke PostgreSQL
lokal di VPS. Ini mengubah prinsip awal "tidak menyalin database SISTER"
menjadi:

- SISTER **tetap source of truth**. Replika adalah salinan baca yang bisa
  tertinggal (stale) sampai sinkronisasi berikutnya; setiap baris membawa
  `fetched_at`, dan `changed_at`/`deleted_at` menunjukkan riwayat perubahan.
- Replika hanya diisi oleh `bun run sister:sync`. Tidak ada POST, PUT, atau
  DELETE ke SISTER; aplikasi juga tidak menulis ke tabel replika dari UI.
- Payload disimpan apa adanya (JSONB) agar tidak ada data yang hilang karena
  schema lokal belum lengkap. Tabel typed/view per modul dibuat di tahap
  berikutnya ketika kebutuhan layar sudah jelas.
- Replika memuat PII (data pribadi, keluarga, alamat, kepegawaian, tunjangan).
  Akses database dibatasi seperti data produksi: tidak diekspos ke publik,
  backup terenkripsi, dan tidak disalin ke laptop tanpa alasan.

## Tabel

| Tabel | Isi |
|---|---|
| `sister_sync_run` | Satu baris per eksekusi: scope, status (`RUNNING`, `SUCCEEDED`, `PARTIAL`, `FAILED`), jumlah request/record/perubahan/error, `stats_json` per endpoint (tanpa payload). |
| `sister_replica_record` | Satu baris per item list atau per response objek. Kunci: `integration_id` + `endpoint` (template, mis. `/penelitian/{id}`) + `scope_key` (query/ID, mis. `id_sdm=...`) + `item_key` (`id`, `id_sdm`, hash konten, atau `self`). Kolom `id_sdm` dan `parent_id` untuk query per SDM dan relasi induk. |
| `sister_replica_scope` | Status fetch per scope: status HTTP terakhir, kode error, waktu sukses terakhir. Dipakai untuk melewati child yang tidak berubah dan untuk melihat scope yang gagal. |

Contoh query:

```sql
-- Semua penelitian (detail) milik satu SDM
select payload_json
  from sister_replica_record
 where endpoint = '/penelitian/{id}' and id_sdm = '<id_sdm>' and deleted_at is null;

-- Scope yang gagal pada sinkronisasi terakhir
select endpoint, scope_key, last_status, last_error_code, last_fetched_at
  from sister_replica_scope
 where last_status <> 200
 order by last_fetched_at desc;
```

## Cara kerja sinkronisasi

Kode: `src/server/sister/replica/` dan `scripts/sister_sync.ts`.

1. `POST /authorize` (role saat ini `Sister-WS Basic`). Token diperbarui
   otomatis saat 401 karena run penuh melebihi umur token 60 menit.
2. **Referensi**: 34 endpoint tanpa parameter, `wilayah` level 0–3,
   `kelompok_bidang` `iptek=true|false`, `kategori_kegiatan?tipe=list`,
   `unit_kerja` untuk PT sendiri (ID dari `profil_pt`) lalu
   `detail_unit_kerja` per unit.
3. **SDM**: `/referensi/sdm`, lalu per SDM: 7 endpoint `data_pribadi/*`,
   38 list `?id_sdm=` termasuk laporan akhir BKD (paginasi `per_page=100` pada kekayaan intelektual,
   penelitian, pengabdian, penunjang lain, publikasi), detail `/{id}` setiap
   item, `/{id}/bidang_ilmu` bila tersedia, `/kelas_kuliah/{id_kelas}/dokumen`
   dari detail pengajaran (hanya kelas milik PT sendiri), dan aktivitas BKD untuk setiap `id_smt` yang ada
   pada `laporan_akhir_bkd` SDM tersebut.
4. Setiap scope yang berhasil diambil utuh di-upsert. Baris yang tidak lagi
   dikembalikan SISTER diberi `deleted_at` (beserta child-nya). Scope yang
   gagal tidak menyentuh data lama.
5. **Inkremental**: detail/child hanya diambil ulang bila item induknya baru
   atau berubah, atau belum pernah sukses diambil. `--refresh-children`
   memaksa semua detail diambil ulang (jadwal mingguan).

Aturan transport: hanya GET, maksimal `--concurrency` request paralel
(default 4) dan `--rps` request per detik (default 4), retry dengan backoff untuk 500/502/503/504 dan jaringan, timeout
90 detik per request (`/referensi/dudi` ±3,5 MB), dan 404 dianggap "tidak ada
data".

**Rate limit SISTER.** Pada 2026-09-29 run tanpa pacing (±20 req/detik)
diblokir 429 setelah ±4.000 request dalam ±4 menit; blokir berlaku untuk
kredensial (termasuk `POST /authorize`), tanpa header `Retry-After`, dan
dicabut sendiri setelah ±15 menit. Karena itu semua request melewati
`RateGate` (`replica_rate_gate.ts`): saat 429, seluruh request dijeda
(30 detik, berlipat hingga 5 menit), laju diturunkan setengah, lalu request
yang sama diulang; laju naik kembali perlahan setelah sukses. Bila 429 tetap
muncul setelah 6 jeda beruntun (±17 menit) run dihentikan dengan status
`FAILED` agar blokir tidak diperpanjang. Data lama tidak pernah dihapus oleh
scope yang gagal.

Opsi CLI:

```bash
bun run sister:sync                         # full
bun run sister:sync --scope referensi       # referensi + indeks SDM
bun run sister:sync --scope sdm --sdm <id>  # satu/lebih SDM (dipisah koma)
bun run sister:sync --sdm-limit 3           # smoke test
bun run sister:sync --refresh-children      # ambil ulang semua detail
bun run sister:sync --dry-run --dump out.json   # tanpa menulis database
```

Di laptop (NODE_ENV bukan production) sync memakai sandbox
`SISTER_BASE_URL_DEV`; di container production memakai `SISTER_BASE_URL`.

## Cakupan

Dari 140 endpoint GET di PDF, 135 direplikasi. Dikecualikan:

- `/data_pribadi/foto/{id_sdm}` dan `/dokumen/{id}/download` — binary, bukan
  JSON. Metadata dokumen tetap direplikasi lewat `/dokumen` dan
  `/dokumen/{id}`.
- `/referensi/mahasiswa_pddikti` — pencarian yang mewajibkan program studi
  dan keyword.
- `/kolaborator_eksternal` (+ detail) — pencarian `nama`/`nik`; tanpa keyword
  SISTER menjawab 400.

Volume terukur (sandbox, 10 SDM pertama): ±6.700 request dan ±8.600 record,
didominasi detail pengajaran dan bimbingan mahasiswa. Full run pertama untuk
97 SDM diperkirakan puluhan ribu request; pada 4 req/detik itu berarti
beberapa jam, jadi jalankan malam hari. Run inkremental berikutnya hanya
±75 request per SDM (±30 menit untuk 97 SDM).

## Penyimpangan kontrak yang ditemukan (live vs PDF)

Terverifikasi di sandbox dan production:

| Endpoint | PDF | Live |
|---|---|---|
| `/referensi/semester` | array | selalu 500 |
| `/referensi/jenis_bahan_ajar`, `/referensi/media_publikasi`, `/referensi/lembaga_sertifikasi`, `/referensi/kelompok_bidang?iptek=false` | array | selalu 500 |
| `/referensi/profil_pt` | array, kunci `id` | satu objek, kunci `id_perguruan_tinggi`; `jalan`, `dusun`, `kode_pos` bisa null |
| `/referensi/perguruan_tinggi` | array | `{}` |
| `/referensi/unit_kerja` tanpa `id_perguruan_tinggi` | wajib parameter | 200 berisi baris `id`/`nama` null |
| `/referensi/kategori_kegiatan` | — | wajib `tipe=list|tree` (tanpa itu 400) |
| `/bkd/*` | angka | string numerik (`"9.5000"`), beberapa null; 404 bila tidak ada data |
| `/penugasan`, `/pendidikan_formal`, `/riwayat_pekerjaan` (+detail) | string wajib | banyak field null; `jenis_ajuan` string/null (bukan integer) |
| `/pendidikan_formal/ajuan/{id}` | objek | sebagian ID menjawab 500 |
| `/nilai_tes/{id}` | objek | 404 untuk ID yang ada di daftar `/nilai_tes` |
| `/referensi/golongan_pangkat`, `jabatan_tugas_tambahan`, `jenis_beasiswa`, `jenis_diklat`, `jenis_kesejahteraan`, `jenis_tes`, `skim_kegiatan` | array | `{}` di sandbox |
| `/kelas_kuliah/{id_kls}/dokumen` | array | 403 "Akses ditolak" untuk kelas di PT lain (`id_pt` pengajaran ≠ PT sendiri); sync hanya mengikuti kelas PT sendiri |
| Gateway | JSON error | 503 `text/plain` "upstream connect error" saat beban tinggi |

Schema aplikasi di `src/server/sister/types.ts` sudah menormalkan
penyimpangan ini (null → string kosong, string numerik → number, objek/`{}`
→ array). Pemilih semester BKD mengambil `id_smt` dari laporan akhir BKD
karena `/referensi/semester` tidak dapat dipakai.

## Jelajah data live (studi struktur)

Halaman `/jelajah` (role ADMIN/OPERATOR) membaca SISTER **live** untuk 45
modul per SDM dan 43 varian referensi, lengkap dengan detail, bidang ilmu,
dan dokumen kelas kuliah. Setiap tampilan punya tab **Struktur data**: field,
tipe JSON yang benar-benar muncul, persentase null/kosong, contoh nilai, dan
usulan tipe kolom PostgreSQL, yang bisa disalin sebagai markdown untuk desain
tabel replika typed. Browser hanya mengirim kunci modul dari katalog
(`src/modules/jelajah/api/jelajah_catalog.ts`) dan ID tervalidasi; path SISTER
ditentukan server. Di laptop request selalu ke sandbox.

Verifikasi 2026-09-29 (sandbox, satu SDM): semua modul per SDM terbaca
(78 request dengan jeda 300 ms); referensi seperti tabel di atas.

## Lapisan typed: schema `replica`

Payload mentah tetap di `sister_replica_record`; di atasnya ada schema
PostgreSQL `replica` berisi **view typed** yang dihasilkan dari struktur data
asli (daftar lengkap: [replica_schema.md](./replica_schema.md)).

- Satu view per endpoint: `replica.penelitian` (detail),
  `replica.penelitian_list` (daftar), `replica.penelitian_bidang_ilmu`,
  `replica.data_pribadi_profil`, `replica.bkd_ajar`,
  `replica.referensi_wilayah`, dst.
- Satu view anak per array objek di dalam payload, mis.
  `replica.publikasi_penulis`, `replica.penelitian_anggota`,
  `replica.penugasan_keaktifan`, `replica.bimbingan_mahasiswa_mahasiswa`,
  `replica.<modul>_dokumen`. Kolom `r_parent_id` = ID item induk.
- Objek bersarang diratakan satu tingkat (`detail_perubahan_ipk_baru`).
- Tipe: `uuid`, `date`, `timestamp`, `bigint`, `numeric`, `boolean`, `jsonb`,
  `text`. Kolom kode (NIDN, NIP, NIK, NPWP, kode pos, `id_smt`, nomor) tetap
  `text` walau berisi angka. Cast memakai `replica.try_*` sehingga nilai tak
  terduga menjadi NULL, bukan error. Kolom meta `r_*` (termasuk `r_payload`
  JSON asli) ada di setiap view.
- Verifikasi 2026-09-29: 171 view (36 view anak), seluruhnya dapat di-query;
  540 kolom typed dicek tanpa satu pun nilai yang hilang karena cast; replay
  semua migration dari nol berhasil.
- 28 view belum punya sampel (modul kosong di sandbox atau endpoint 500) dan
  sementara hanya berisi kolom meta + `r_payload`.

Regenerasi setelah sync membawa field/modul baru:

```bash
bun run replica:views          # tulis migration baru + replica_schema.md
bunx prisma migrate deploy
```

Schema `replica` adalah data turunan: migration-nya selalu `DROP SCHEMA
replica CASCADE` lalu membuat ulang. Jangan membuat objek manual di dalamnya.

## Halaman yang membaca replika

- `/replika` **Data Replika** (semua role yang login): pilih SDM (indeks dari
  `replica.referensi_sdm`, tanpa request ke SISTER) dan modul; tabel dibaca
  dari view `replica`, dengan jumlah data per modul untuk SDM terpilih. Tombol
  Detail menampilkan baris detail beserta view anak (anggota, penulis,
  dokumen, bidang ilmu, dokumen kelas kuliah, jurusan/wilayah unit kerja).
  Tab Struktur data dan JSON sama seperti Jelajah Data.
- `/replika/status` **Status Sinkronisasi** (ADMIN/OPERATOR): 20 run
  terakhir (target sandbox/production, request, record, perubahan, error)
  dan scope yang gagal dikelompokkan per endpoint dan status HTTP.
- Nama view hanya diambil dari katalog database (`pg_class` schema
  `replica`) dan katalog modul server; input browser hanya kunci modul dan ID
  tervalidasi. Maksimal 5.000 baris per tabel (`/referensi/dudi` terpotong).

Halaman lama (Pegawai, BKD, Penugasan, Pendidikan Formal, Riwayat Pekerjaan)
dan Jelajah Data tetap membaca SISTER live.

## Belum dikerjakan (tahap berikutnya)

- Memutuskan halaman lama mana yang dipindah ke replika.
- Retensi/pembersihan baris `deleted_at` lama dan kebijakan backup.
- Tampilan status sinkronisasi di UI admin.
