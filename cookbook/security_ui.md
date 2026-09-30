# Kontrol akses UI managerial SISTER

Status: requirement tambahan untuk UI seluruh GET, 2026-09-30; belum merupakan
hasil audit. Baca bersama [security.md](./security.md), [prd_managerial.md](./prd_managerial.md)
dan [ui_endpoint_map.md](./ui_endpoint_map.md). File security.md belum dapat
ditulis pada sesi ini karena izin file Windows.

## Aturan portable

Permission berlaku sampai data yang dikirim server, bukan hanya menu yang
terlihat. Setiap list, detail, child, agregasi, pencarian dan file harus
memeriksa actor, tenant/integration dan kepemilikan resource. DTO yang
dikirim UI hanya memuat field yang boleh dibaca actor.

## Project Profile dan acceptance

- Pengguna utama adalah ADMIN lokal. Credential PT SISTER tetap server-only;
  role ADMIN tidak memberikan hak mengakses data di luar akun PT.
- Halaman bisnis baru memakai permission eksplisit per modul dan field;
  PII keluarga/kependudukan/alamat, benefit dan dokumen default ADMIN sampai
  kebijakan role lain disepakati. Ini target, bukan klaim semua route existing
  telah menerapkannya.
- Query replika/view menyertakan integration ID yang dipercaya dari context,
  SDM/resource yang sah dan status aktif; jangan percaya input integration
  dari browser. Detail dan nested query memeriksa relasi dengan parent.
- Agregasi/report memakai pembatasan yang sama; count dan filter pilihan
  tidak boleh membocorkan keberadaan record yang dilarang.
- File/photo route memeriksa kepemilikan ID dan role di server sebelum fetch;
  nama file/content disposition aman, MIME/ukuran dibatasi, private/no-store.
  File endpoint existing perlu diverifikasi; validasi UUID bukan ownership.
- 403 lintas PT tidak diatasi dengan mengganti ID PT atau mencoba ID lain.
  Kolaborator/mahasiswa live menggunakan allowlist field dan batas akun.
- Render teks external sebagai teks; jangan merender HTML tak tepercaya.
  Validasi tautan dokumen external dan cegah skema javascript/data yang berbahaya.
- Browser tidak menerima raw payload JSON secara default pada halaman bisnis.
  Explorer teknis perlu permission tersendiri dan review field PII.
- Logging/audit tidak merekam credential, bearer token, NIK lengkap, isi
  dokumen, atau query pencarian sensitif. Catat actor, outcome, request ID dan
  target yang diperlukan.
- Cache query dibersihkan pada logout/pergantian akun; data restricted tidak
  tersisa sebagai cache yang bisa dibaca pengguna berikutnya.

## Evidence yang diperlukan per paket UI

Uji akses langsung tRPC/file dan deep link tanpa sesi, role tak berhak,
integration berbeda, parent-child tak cocok, serta input invalid.
Periksa DTO/list/detail/agregasi dan raw explorer untuk exposure field.
Pisahkan hasil code/test, browser QA dan audit deployment.
Tidak menyebut semua UI aman hanya karena menu sudah tersembunyi.

Scope produk aktif hanya read SISTER; kontrol mutation/upload pada kontrak
portable lama tidak menjadi alasan menambah fitur write ke release ini.
