# Portable Design System Contract

Dokumen ini adalah kontrak visual dan interaksi portable untuk aplikasi
operasional yang modern, tenang, ringkas, dan berpusat pada pekerjaan. Bentuk
komponen diambil dari reference implementation aplikasi lain, tetapi brand,
warna, route, data, dan aturan bisnis harus diadaptasi oleh project tujuan.

Status dokumen: portable base + project profile.

## Project Profile: `sister-integrated`

Bagian ini adalah adapter untuk repository saat ini. Saat file dipindahkan ke
repository lain, bagian ini boleh diganti tanpa mengubah kontrak komponen di
bawahnya.

- Produk: portal administrasi perguruan tinggi yang terintegrasi dengan SISTER.
- Identitas visual: hijau sebagai warna primary dan action pada light/dark mode.
- Chart: `apexcharts` + `react-apexcharts` melalui widget `ReportChart`.
- Komponen dasar bersama: `src/component/ui/`.
- Widget bersama: `src/component/widget/`.
- Nilai warna dan font: `src/const/theme.ts` sebagai sumber konfigurasi theme.
- Komponen tidak boleh mengetahui credential, token, atau endpoint SISTER.
- Kontrak security lintas layer: `security.md`; dokumen ini hanya menetapkan
  perilaku security yang terlihat pada UI.

## UI baca lengkap dan managerial (2026-09-30)

Pola portable: setiap operasi baca mempunyai tujuan pengguna, jalur navigasi,
list/detail atau konteks induk, label bisnis, dan state sumber. Generic JSON
explorer tidak menjadi kriteria selesai sebuah halaman bisnis.
Project Profile Sisterbridge mengikuti [ui_endpoint_map.md](./ui_endpoint_map.md)
dan [prd_managerial.md](./prd_managerial.md); cakupan seluruh GET, read-only.

- Sidebar mengelompokkan modul sesuai domain; referensi memakai direktori.
  Tidak perlu menu per endpoint. Ajuan berada pada modulnya, dokumen kelas
  dibuka dari pengajaran. Jangan menampilkan link hash atau tombol placeholder.
- List memakai kolom yang dipilih untuk tugas admin; nama/label didahulukan,
  bukan UUID mentah. Filter hanya untuk field yang benar-benar ada.
- Detail terdiri dari field berlabel dan widget relasi. Array penulis,
  anggota, mahasiswa, bidang ilmu, dan dokumen dapat ditelusuri;
  “[n item]” atau JSON mentah bukan satu-satunya tampilan.
- Search/filter/tab/pagination berada pada URL agar deep link/back/refresh
  bekerja. State per child terpisah dari state halaman induk.
- Referensi memakai label dan kode; pilih parent sebelum child. Nilai yang
  belum tersedia tidak boleh tampil seperti opsi valid kosong.
- Report menampilkan scope, periode, freshness, unit hitung dan drill-down.
  Grafik ApexCharts mempunyai padanan tabel; jangan memaksakan chart pada
  tiap endpoint yang hanya berupa data detail.
- Warning menampilkan alasan dan sumber record. “Belum dapat dinilai”
  berbeda dari “Bermasalah”. Teknis HTTP/detail SQL disimpan di alat diagnosis;
  halaman admin memakai penjelasan yang membantu keputusan.
- Foto/preview/unduh berada pada konteks dokumen; indikator live bila
  membutuhkan SISTER. Binary tidak dimuat massal saat halaman list dibuka.

Inset horizontal header dan semua halaman **30px**. Width cap/centering lama
tidak boleh menambah margin horizontal aktual melebihi permintaan ini pada
halaman workspace; konten harus memanfaatkan lebar yang tersisa setelah sidebar.
Pada mobile pertahankan inset, izinkan toolbar wrap dan tabel scroll lokal.

Breadcrumb body maksimal tiga level: icon kotak-kotak > menu > submenu.
Detail: icon kotak-kotak > elipsis tengah > Detail nama record.
Header hanya search global dan profil kanan. Action/filter/search halaman
sejajar di kanan breadcrumb; aksi baris/pagination tetap dekat tabel.
Tidak ada title/deskripsi visual yang mengulang breadcrumb; h1 sr-only.
Tidak ada card pembungkus form/filter atau card dalam card; gunakan divider.

Shared widget target: daftar, detail berlabel, relasi anak, metadata/file,
status/freshness, report dengan drill-down, dan daftar warning.
Primitive tetap pada component/ui, widget gabungan pada component/widget atau
module/widget. Warna/font hanya dari const/theme.ts. Nama widget spesifik
endpoint pada matriks adalah owner/tanggung jawab dan boleh menggunakan
shared widget yang sama agar styling berubah serentak.

Acceptance visual setiap modul: 1280/1024/390/320, light/dark, keyboard,
focus/aria, breadcrumb/toolbar, dan state loading/empty/not-synced/partial/
stale/forbidden/error. Tanda selesai API tidak menggantikan QA tersebut.

## Cara Menggunakan

File ini adalah spesifikasi, bukan package UI. Mengambil file Markdown saja tidak
akan membuat website baru otomatis memiliki tampilan yang sama. Untuk hasil yang
konsisten, aplikasi baru perlu membawa enam bagian berikut:

1. Token CSS pada bagian Warna.
2. Global reset, typography, layout shell, dan responsive rule.
3. Shared component dengan kontrak pada bagian Komponen.
4. Theme provider yang menambahkan class `light` atau `dark` pada elemen root.
5. Dependency icon, select, dan chart bila fitur tersebut dipakai.
6. QA visual pada viewport desktop, mobile, light, dan dark.
7. Security UI contract dan audit evidence sesuai `security.md`.

Jika reference implementation tersedia, lokasinya dapat berupa
`frontend/src/components/ui/` dan `frontend/src/styles.css`. Lokasi tersebut
hanya sumber visual; aturan di dokumen ini adalah kontrak yang harus
dipertahankan ketika komponen dipindahkan ke aplikasi baru.

### Batas Portable Dan Adapter

Bagian berikut portable: token, ukuran, radius, warna status, pola layout,
perilaku keyboard, accessibility, dan kontrak shared component.

Bagian berikut adalah adapter aplikasi dan harus diganti pada aplikasi baru:

- nama produk, logo, label sidebar, dan footer;
- route breadcrumb, misalnya `/dashboard` atau `/import-batch`;
- sumber data, state management, autentikasi, dan API;
- isi tabel, label status domain, grafik, serta copy publik;
- aturan akses, permission, dan workflow bisnis.

Jangan menyalin route atau domain dari reference application hanya karena
menyalin `PageHeader`. `PageHeader` harus menerima home/parent breadcrumb dari
adapter.

## Arah Visual

Gunakan antarmuka operasional yang tenang dan mudah dipindai. Data utama berada
di ruang kerja dan tabel; aksi berada di toolbar; detail dibuka ketika diperlukan.

- Satu page header untuk satu halaman.
- Satu boundary tabel untuk satu kumpulan data.
- Section memakai whitespace dan divider, bukan floating card.
- Card hanya untuk item berulang, dialog, popover, atau tool yang memang perlu
  dibingkai.
- Hindari card di dalam card, gradient hero, glow, blob, bokeh, dan dekorasi yang
  tidak membantu pekerjaan.
- Hindari deskripsi yang mengulang label. Pindahkan keterangan sekunder ke
  tooltip atau state bantuan yang muncul saat diperlukan.
- Jangan menampilkan data yang sama dua kali dengan bahasa berbeda.
- Status harus memakai teks; warna saja tidak cukup.
- Aksi yang belum tersedia harus berstatus rencana atau disabled dengan alasan,
  bukan tombol dummy.

Referensi proporsi dan pola interaksi:

- [shadcn/ui Dashboard](https://ui.shadcn.com/examples/dashboard)
- [IBM Carbon Data Table](https://carbondesignsystem.com/components/data-table/usage/)
- [IBM Carbon Typography](https://carbondesignsystem.com/elements/typography/type-sets/)

Referensi tersebut bukan template yang harus disalin. Framework dapat React,
Vite, Next.js, atau framework lain selama kontrak visual dan interaksinya sama.

## Dependency Reference

Dependency di bawah dipakai oleh implementasi React saat ini. Versi boleh
diperbarui mengikuti aplikasi baru; perilaku komponen harus tetap sama.

| Kebutuhan             | Reference                         |
| --------------------- | --------------------------------- |
| UI framework          | React + TypeScript                |
| Build                 | Vite                              |
| CSS utility, opsional | Tailwind CSS 4                    |
| Select custom         | `@radix-ui/react-select`          |
| Icon                  | `lucide-react`                    |
| Chart bila dipakai    | `apexcharts` + `react-apexcharts` |
| Dialog                | Native HTML `<dialog>`            |

Tidak wajib menggunakan shadcn CLI. Komponen lokal mengikuti pola shadcn:
primitive kecil, token terpusat, variant terbatas, dan halaman hanya menyusun
komponen tanpa mengulang styling kontrol.

### Reference Implementation Map

Saat mengambil implementasi React yang sudah ada, gunakan file berikut sebagai
paket visual. File di luar daftar ini adalah adapter atau fitur domain. Pada
project `sister-integrated`, hasil adaptasinya ditempatkan pada folder singular
`component`.

```text
src/component/ui/
  button.tsx       form-dialog.tsx   help-tip.tsx     layout.tsx
  pagination.tsx   select.tsx         section.tsx      state.tsx
  status-badge.tsx tabs.tsx           theme-toggle.tsx
src/component/widget/
  data-table.tsx   metric-card.tsx    report-chart.tsx
src/const/theme.ts
src/component/theme-context.ts
src/component/theme-provider.tsx
src/hook/use-theme.ts
src/styles.css
```

`styles.css` saat ini juga memuat style halaman domain dan publik. Saat diekstrak,
pertahankan blok token, global CSS, layout shell, dan primitive; pindahkan style
khusus domain ke stylesheet aplikasi baru agar package tetap portable. Jangan
menyalin nama route atau komponen domain dari reference secara otomatis.

## Design Tokens

Token memakai HSL tanpa fungsi `hsl()` di nilai variable. Gunakan dengan
`hsl(var(--token))` atau `hsl(var(--token) / alpha)`.

Untuk project TypeScript, nilai token yang digunakan runtime harus memiliki satu
sumber konfigurasi pada `src/const/theme.ts`. CSS variable, theme provider, dan
ApexCharts mengambil nilai dari sumber tersebut; jangan menyebarkan nilai warna
hardcoded di halaman atau widget.

```css
:root {
  --background: 140 25% 98%;
  --foreground: 152 30% 10%;
  --card: 0 0% 100%;
  --card-foreground: 152 30% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 152 30% 10%;
  --primary: 142 76% 30%;
  --primary-foreground: 0 0% 100%;
  --secondary: 140 25% 91%;
  --secondary-foreground: 152 30% 10%;
  --muted: 140 25% 96%;
  --muted-foreground: 152 12% 40%;
  --accent: 142 60% 94%;
  --accent-foreground: 142 76% 25%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 140 25% 98%;
  --border: 140 22% 88%;
  --input: 140 22% 88%;
  --ring: 142 76% 30%;
  --success: 142 71% 45%;
  --success-foreground: 144 70% 96%;
  --warning: 38 92% 50%;
  --warning-foreground: 48 96% 89%;
  --info: 199 89% 48%;
  --info-foreground: 204 100% 97%;
  --radius: 0.5rem;
}

.dark {
  --background: 152 30% 7%;
  --foreground: 140 30% 98%;
  --card: 152 30% 10%;
  --card-foreground: 140 30% 98%;
  --popover: 152 30% 10%;
  --popover-foreground: 140 30% 98%;
  --primary: 142 70% 45%;
  --primary-foreground: 152 35% 8%;
  --secondary: 152 24% 18%;
  --secondary-foreground: 140 30% 98%;
  --muted: 152 24% 16%;
  --muted-foreground: 145 16% 65%;
  --accent: 152 24% 18%;
  --accent-foreground: 142 70% 82%;
  --destructive: 0 63% 50%;
  --destructive-foreground: 140 30% 98%;
  --border: 152 24% 18%;
  --input: 152 24% 18%;
  --ring: 142 70% 45%;
  --success: 142 69% 45%;
  --success-foreground: 144 70% 96%;
  --warning: 43 96% 56%;
  --warning-foreground: 38 92% 12%;
  --info: 199 89% 55%;
  --info-foreground: 204 100% 97%;
}
```

### Semantic Color

| Token              | Penggunaan                                      |
| ------------------ | ----------------------------------------------- |
| `primary`          | Aksi utama, link, selected state, focus ring    |
| `background`       | Latar halaman                                   |
| `card`             | Surface sidebar, input, dialog, item terbingkai |
| `popover`          | Dropdown dan tooltip                            |
| `muted`            | Header tabel, surface sekunder, hover ringan    |
| `muted-foreground` | Caption, label sekunder, breadcrumb parent      |
| `border` / `input` | Garis pemisah dan border form                   |
| `success`          | Berhasil, tersimpan, valid                      |
| `warning`          | Peringatan atau perlu pemeriksaan               |
| `destructive`      | Error, gagal, aksi berisiko                     |
| `info`             | Informasi kontekstual                           |

Hijau adalah warna identitas dan aksi, bukan warna untuk semua hal. Status sukses,
warning, error, dan info tetap memakai warna semantic masing-masing.

## Global CSS Contract

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: 24px;
}

body {
  margin: 0;
  min-width: 0;
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-size: 14px;
  line-height: 1.6;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

h1,
h2,
h3,
p {
  margin: 0;
  letter-spacing: 0;
}

:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 3px;
}
```

## Typography And Spacing

| Elemen                      | Size / line-height | Weight          |
| --------------------------- | ------------------ | --------------- |
| Page heading semantic `h1`  | 24 / 32px          | 600             |
| Section/dialog heading `h2` | 16 / 24px          | 600             |
| Subheading `h3`             | 15 / 24px          | 600             |
| Breadcrumb                  | 14 / 22px          | 400; active 500 |
| Body, input, table          | 14 / 22px          | 400             |
| Button dan label            | 14 / 20px          | 500             |
| Caption dan table header    | 12 / 18px          | 500             |
| Metric number               | 28 / 36px          | 600             |
| Landing heading desktop     | 48 / 56px          | 600             |
| Landing heading mobile      | 36 / 44px          | 600             |
| Public section heading      | 28 / 36px          | 600             |

- Gunakan system sans. Inter hanya jika asset benar-benar dimuat.
- Letter spacing selalu `0`; jangan menggunakan ukuran font berbasis viewport.
- Weight maksimum 600. Bold bukan default.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px.
- Padding horizontal area kerja dan header: 40px pada desktop/tablet. Mobile
  boleh turun ke 16px bila viewport tidak cukup, tetapi layout utama project
  ini memakai `px-[40px]`.
- Angka memakai tabular numerals.
- Input dan button tinggi 40px; target sentuh mobile minimal 44px.

## Radius And Surface

| Elemen                               | Radius | Catatan                   |
| ------------------------------------ | ------ | ------------------------- |
| Button, input, nav item              | 6px    | Kontrol compact           |
| Table, dialog, repeated item         | 8px    | Satu permukaan terbingkai |
| Section, page header, summary inline | 0px    | Tidak menjadi card        |
| Dropdown dan tooltip                 | 6px    | Shadow ringan             |

Shadow hanya dipakai untuk dialog dan popover. Jangan menambahkan radius
asimetris, shadow pada setiap section, atau hover yang menggeser layout.
Jangan membuat card di dalam card. Card boleh dipakai untuk satu unit informasi,
table shell, dialog, repeated item, atau state penting; form filter, search,
dan toolbar tidak boleh dibungkus card.

## Layout Shell

```text
Desktop
app-shell: 224px sidebar | minmax(0, 1fr) content
content: mobile-topbar? -> topbar -> page-content

Page content
breadcrumb-row: breadcrumb kiri | page-actions kanan
section: heading/toolbar -> content -> pagination
```

- Sidebar desktop lebar 224px, sticky, dan tinggi viewport.
- Header grup sidebar tetap tampil. Gunakan grup yang relevan dengan aplikasi baru.
- Topbar/header aplikasi hanya berisi search global dan profil/user menu di
  ujung kanan. Jangan menaruh breadcrumb, judul halaman, deskripsi halaman,
  status modul, atau tombol kembali di header.
- Breadcrumb selalu berada di area halaman, bukan di header.
- Breadcrumb row memiliki satu breadcrumb di kiri dan satu grup aksi/filter di
  kanan.
- Page content mengisi lebar workspace dengan inset horizontal 30px dan
  `min-width: 0` pada child. Jangan menambah max-width/margin-auto yang
  memperbesar margin horizontal halaman; tabel memakai scroll lokal.
- Section data tidak dibungkus card tambahan.
- Halaman tidak menampilkan title dan deskripsi visual terpisah bila nama
  halaman sudah jelas dari breadcrumb. Jika tetap perlu heading aksesibel,
  render sebagai `sr-only`.
- Aksi per baris dan pagination tetap dekat dengan tabel, bukan dipindah ke
  breadcrumb row.

### Breadcrumb Dan Page Actions

Breadcrumb menggantikan judul yang terlihat. Tetap render satu `h1` aksesibel
dengan class `sr-only`.

Kontrak portable:

```ts
type BreadcrumbItem = { label: string; href?: string };

type PageHeaderProps = {
  title: string;
  breadcrumb: BreadcrumbItem[];
  action?: React.ReactNode;
};
```

Aturan:

- Parent breadcrumb berupa link; item aktif memakai `aria-current="page"`.
- Breadcrumb maksimal 3 level termasuk icon awal.
- Format halaman list: `[icon_kotak-kotak] > [nama_menu] > [nama_submenu]`.
- Format halaman detail/proses: `[icon_kotak-kotak] > [dot_3_di_tengah] >
  Detail [nama_data_dari_detail]`. Pola ini juga dipakai untuk halaman tambah,
  ubah, review, atau proses lain.
- Nama aktif memakai ellipsis dan `title`, bukan mendorong toolbar keluar layar.
- Filter dropdown, date picker, search per halaman, dan button aksi halaman
  berada di kanan breadcrumb dalam satu flex group. Jangan meletakkannya di
  bawah konten atau membungkusnya dalam card.
- Gap antar kontrol 8px.
- Select toolbar lebar 152px; search toolbar lebar 180px.
- Pada mobile breadcrumb berada di baris pertama; aksi boleh wrap ke baris berikutnya.
- Label visual yang sudah jelas tidak perlu deskripsi tambahan. Label aksesibel
  tetap wajib untuk kontrol icon-only.

## Shared Components

Semua komponen berulang berada di satu folder, misalnya
`src/component/ui/`, dan diekspor melalui satu barrel `index.ts`. Gunakan nama
folder singular `component` sesuai konvensi project saat ini.

Komponen dasar yang disiapkan untuk project ini meliputi button, form field,
modal/dialog, status badge/bar, dropdown/select, date picker, breadcrumb,
sidebar, toast, tabs, tooltip, state, pagination, dan icon button. Komponen
tersebut hanya menangani presentasi, interaksi, accessibility, dan props yang
jelas; data fetching serta aturan bisnis berada di module.

### `AppButton`

```ts
type AppButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  icon?: LucideIcon;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};
```

Primary untuk aksi utama. Secondary untuk aksi alternatif. Ghost hanya untuk
aksi ringan. Icon memakai `lucide-react`, bukan SVG manual. State loading harus
langsung men-disable button dan mengganti label bila operasi asynchronous.

### `IconButton`

Button icon-only selalu memiliki `aria-label` dan tooltip. Tooltip mendukung
hover, focus, dan touch; tooltip bukan satu-satunya cara untuk memahami aksi.
Target desktop 36px, target mobile minimal 44px.

### `Select`

Select wajib custom. Jangan memakai popup default browser untuk filter atau form.

- Gunakan Radix Select atau primitive setara.
- Trigger tinggi 40px, radius 6px, padding 8px 12px.
- Ikon trigger adalah `ChevronDown`; item terpilih memakai `Check`.
- Popup memiliki border, background popover, radius 6px, padding 4px, dan shadow.
- Item minimal tinggi 36px, padding 8px 10px.
- Dukung keyboard, typeahead, focus, selected state, disabled state, dan
  collision viewport.
- Di dalam native dialog, portal popup harus ditempatkan di bawah dialog agar
  tidak tertutup top layer.
- Label form tetap disediakan; label yang tidak perlu terlihat boleh memakai
  `sr-only`.

### `DatePicker`

Date picker wajib custom sesuai token tema. Jangan memakai tampilan default
browser sebagai UI final.

- Format nilai mengikuti kontrak external API, misalnya `yyyy-mm-dd`.
- Kontrol tanggal yang berada di toolbar tetap sejajar di kanan breadcrumb.
- Trigger/input tinggi 40px, radius 6px, dan focus ring sama dengan input lain.
- Sediakan label aksesibel, empty state, disabled state, dan validasi format.
- Calendar popover memakai border, background popover, radius 6px, padding 4px,
  dan shadow ringan.

### Widget `DataTable`

`DataTable` adalah widget karena menggabungkan table, state, pagination, dan
toolbar bila diperlukan. Letakkan di `component/widget/` jika generik, atau di
`<module>/widget/` jika mengetahui domain tertentu.

- Satu border luar dengan radius 8px; jangan masukkan tabel ke card lain.
- Lebar tabel 100% dan scroll horizontal hanya di `.table-shell`.
- Header 12px/18px weight 500, background muted.
- Cell padding 12px 16px dan tinggi minimum baris 48px.
- Header tabel boleh sticky terhadap area scroll.
- Gunakan `scope="col"`, region label, dan tabular numerals.
- Empty state, loading, dan error harus dibedakan. Jangan menyamakan data belum
  tersedia dengan angka nol.

### `StatusBadge`

Badge ringkas: padding 2px 8px, radius 4px, font 12px/20px weight 500.
Variant: `neutral`, `info`, `success`, `warning`, `destructive`. Teks status
harus tetap terlihat dalam light dan dark mode.

### `FormDialog`

Gunakan native `<dialog>` atau primitive setara dengan:

- satu surface dialog, lebar normal 480px dan detail maksimal 760px;
- radius 8px, shadow hanya pada dialog;
- judul aksesibel, tombol tutup icon dengan tooltip, Escape, dan backdrop;
- focus containment serta focus kembali ke trigger;
- button submit disabled selama request;
- field dan error tetap terlihat tanpa window `alert` atau `confirm`.

### `ViewTabs`

Tab dipakai untuk dua sampai lima view yang masih memiliki konteks halaman sama.
Tab tidak otomatis menjadi menu sidebar.

- Gunakan `role="tablist"`, `role="tab"`, `aria-selected`, dan `tabpanel`.
- Hanya tab aktif berada dalam tab order.
- Arrow Left/Right, Home, dan End memindahkan fokus.
- Tab aktif memakai warna primary dan underline 2px.

### `HelpTip`

Gunakan untuk penjelasan sekunder yang memang dibutuhkan. Help tip harus dapat
dibuka dengan click/touch dan keyboard, memiliki `aria-expanded`, dan ditutup
dengan Escape atau saat fokus keluar. Jangan menaruh paragraf deskripsi panjang
di setiap section.

## Widgets

Widget adalah gabungan beberapa component yang memiliki pola tampilan atau
interaksi berulang. Widget dibuat agar halaman tidak panjang dan perubahan
styling cukup dilakukan satu kali.

- `component/widget/` berisi widget generik lintas module, misalnya data table,
  metric card, filter bar, dan report chart.
- `<module>/widget/` berisi widget yang hanya memahami domain module tersebut,
  misalnya `pegawai_table` atau `pegawai_summary`.
- Widget boleh menggabungkan component dasar, tetapi tidak boleh memanggil API
  SISTER secara langsung.
- Widget menerima data dan callback melalui props atau hook module yang jelas.
- Jika hanya dipakai satu kali dan tidak memiliki pola stabil, tetap letakkan di
  page agar tidak membuat abstraksi prematur.

### `ReportChart`

Chart hanya digunakan untuk angka agregat. Implementasi proyek ini menggunakan
ApexCharts melalui `apexcharts` + `react-apexcharts`, dengan tinggi stabil
280px, tooltip nilai, warna semantic, toolbar tersembunyi, dan reduced motion.
Gunakan chart untuk perbandingan/tren; jangan memakai chart sebagai pengganti
tabel operasional atau mengulang angka yang sama di banyak panel.

## Responsive Contract

| Breakpoint | Aturan                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| > 1024px   | Padding content 32px, desktop sidebar, chart dashboard dapat dua kolom |
| 801-1024px | Padding content 24px, chart mulai menyempit                            |
| <= 800px   | Chart satu kolom, metric grid dua kolom                                |
| <= 760px   | Sidebar menjadi menu, topbar mobile, content 16px, kontrol 44px        |

Pada mobile:

- Sidebar tidak selalu menutupi content; gunakan tombol buka/tutup.
- User identity boleh diringkas, tetapi theme dan logout tetap tersedia.
- Page actions boleh wrap dan tidak boleh keluar viewport.
- Table scroll terjadi di area table, bukan pada seluruh halaman.
- Dialog memiliki lebar `calc(100% - 32px)` dan tinggi maksimal viewport.
- Text panjang wrap atau ellipsis dengan `title`; tidak boleh overlap.
- Jangan mengecilkan font hingga target sentuh atau keterbacaan rusak.

## Theme Contract

Theme memiliki tiga nilai: `light`, `dark`, dan `system`. Theme provider:

1. Menentukan resolved theme dari pilihan user atau system preference.
2. Menambahkan class `light` atau `dark` pada `document.documentElement`.
3. Menyimpan pilihan eksplisit di local storage.
4. Mendengarkan perubahan `prefers-color-scheme` ketika mode `system` aktif.
5. Menyediakan toggle dengan icon Moon/Sun dan label aksesibel.

Tidak boleh ada warna hardcoded yang mengalahkan token untuk background, text,
border, popup, atau status. Warna chart boleh berupa hex semantic yang dipetakan
ke token chart, selama light/dark tetap terbaca.

## Security UI Contract

Kontrak security utama berada di `security.md`. Primitive dan widget hanya
menetapkan aturan UI berikut:

- jangan menampilkan credential, bearer token, cookie, raw header, atau stack
  trace pada halaman;
- jangan menyimpan token external di localStorage, sessionStorage, URL, atau
  props yang dapat masuk client bundle;
- PII hanya ditampilkan jika permission dan kebutuhan halaman mengizinkan;
- error, forbidden, stale, dan security event memiliki state teks yang jelas;
- tombol mutation segera disabled/loading setelah submit dan tidak melakukan
  retry dari click berulang;
- link dokumen dan external link harus memakai URL yang sudah dinormalisasi;
- HTML dari API external tidak dirender mentah tanpa sanitization yang disetujui;
- icon-only security action memiliki label, tooltip, dan confirmation yang
  menjelaskan dampaknya;
- audit security ditampilkan melalui data yang sudah direduksi, bukan raw log.

UI QA tidak membuktikan authorization atau secret safety. Evidence tersebut
harus berasal dari test server, contract test, configuration review, atau audit
yang dicatat pada `security.md`.

## Page Patterns

| Pattern          | Isi                                                              |
| ---------------- | ---------------------------------------------------------------- |
| Dashboard        | KPI agregat dan chart; tidak ada daftar yang mengulang KPI       |
| List page        | Page header, search/filter, satu tabel, pagination               |
| Detail page      | Breadcrumb, summary seperlunya, tabs atau section data           |
| Form page/dialog | Field terkelompok, error dekat field, submit/cancel jelas        |
| Public landing   | Nama produk, konteks singkat, satu CTA, workflow, FAQ seperlunya |
| Login            | Email/password, reveal password, theme, error, kembali ke publik |

Data page harus memiliki URL yang dapat dibuka langsung. Sidebar memakai link
nyata, bukan button yang hanya mengubah state. Browser back, forward, dan refresh
harus mempertahankan konteks route.

### Konten Publik

- Hero memakai nama produk sebagai H1 dan media produk sebagai sinyal first viewport.
- Satu kalimat menjelaskan konteks; CTA utama terlihat tanpa membaca seluruh halaman.
- Section publik memakai layout unframed atau satu frame yang benar-benar
  diperlukan, bukan kumpulan card bertingkat.
- Jelaskan workflow satu kali. Jangan mengulangnya sebagai feature cards,
  process rail, dan strip statistik.
- Hindari istilah internal seperti worker, raw row, dependency graph, atau
  deployment pada halaman publik.

## Accessibility And QA

Checklist minimum sebelum design system dipakai di aplikasi baru:

- [ ] Semua icon button memiliki `aria-label` dan tooltip.
- [ ] Focus ring terlihat pada keyboard.
- [ ] Semua input memiliki label; label visual boleh `sr-only`.
- [ ] Tab, select, dialog, dan tooltip dapat dipakai tanpa mouse.
- [ ] Dialog mengembalikan fokus dan menutup dengan Escape.
- [ ] Loading, empty, error, success, disabled, dan permission state tersedia.
- [ ] Tidak ada overflow horizontal pada halaman; hanya tabel yang boleh scroll.
- [ ] Test pada 1280px, 1024px, 390px, dan 320px.
- [ ] Test light dan dark.
- [ ] Test nama file/text panjang, zero state, error state, dan dialog.
- [ ] Build, lint, unit test, dan screenshot browser dicatat terpisah.

## Extraction Checklist

Untuk membuat aplikasi baru dengan visual yang sama, ambil urutan berikut:

1. Salin token dan global CSS, lalu pastikan class `.light`/`.dark` bekerja.
2. Salin primitive `button`, `select`, `data-table`, `dialog`, `tabs`, `badge`,
   `tooltip`, `layout`, `state`, dan `pagination`.
3. Tempatkan primitive pada `src/component/ui/`, widget generik pada
   `src/component/widget/`, dan nilai theme pada `src/const/theme.ts`.
4. Sesuaikan adapter `Brand`, breadcrumb, sidebar route, dan theme storage key.
5. Buat satu halaman list dan satu halaman form sebagai reference screen.
6. Jalankan QA responsive dan accessibility sebelum menambah fitur domain.
7. Jangan menyalin komponen domain reference jika aplikasi baru tidak
   membutuhkan workflow tersebut.
8. Jalankan security review untuk component/widget dan sinkronkan evidence-nya
   dengan `security.md`.

Dengan checklist ini, aplikasi baru akan memakai design system yang sama secara
visual dan interaktif. Kesamaan pixel-perfect tetap memerlukan asset logo, font,
isi, dan implementasi component yang sama.
