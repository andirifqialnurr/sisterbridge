# SisterBridge VPS Deployment Runbook

Panduan ini digunakan untuk menyiapkan aplikasi baru pada domain:

```text
http://sisterbridge.andirifqialnur.my.id/
```

Target akhirnya:

```text
Browser
  -> HTTPS :443
  -> Nginx di host VPS
  -> container aplikasi SisterBridge
  -> database/Redis melalui network Docker internal
```

## 1. Baseline VPS yang sudah diketahui

Server:

```text
OS        : Ubuntu 24.04
Public IP : 157.119.222.101
SSH user  : rifqi
```

Akses SSH dari PowerShell:

```powershell
ssh app-deployer-vps
```

Path aplikasi yang sudah ada:

```text
/opt/apps/app-deployer/app-deployer-web
/opt/apps/app-deployer/app-deployer-mobile
/opt/apps/brige-neofeeder
/opt/apps/db-admin
```

Catatan: folder NeoFeeder di server memang bernama `brige-neofeeder`.

## 2. Port yang sudah terpakai

Jangan memakai port host berikut untuk aplikasi baru:

| Port host | Penggunaan |
|---:|---|
| 80 | HTTP Nginx |
| 443 | HTTPS Nginx |
| 1000 | NeoFeeder frontend |
| 2000 | NeoFeeder backend |
| 3000 | App Deployer web |
| 5432 | PostgreSQL App Deployer, localhost saja |
| 8088 | Adminer, localhost saja |

Cek kondisi terbaru sebelum memilih port:

```bash
sudo ss -ltnp
```

Contoh pilihan port host untuk SisterBridge adalah `3100`, selama port tersebut belum digunakan.

Port aplikasi sebaiknya hanya bind ke localhost:

```yaml
ports:
  - "127.0.0.1:3100:3000"
```

Dengan mapping tersebut, port `3100` hanya terbuka di VPS dan diteruskan ke port `3000` di dalam container. Akses publik tetap masuk melalui Nginx port `443`.

## 3. Verifikasi DNS

Di PowerShell laptop:

```powershell
Resolve-DnsName sisterbridge.andirifqialnur.my.id -Type A
```

Hasil yang diharapkan:

```text
157.119.222.101
```

Jika DNS belum mengarah ke IP tersebut, buat record:

| Type | Name | Value |
|---|---|---|
| A | `sisterbridge` | `157.119.222.101` |

TTL boleh memakai Auto atau 300 detik.

## 4. Siapkan folder aplikasi

Gunakan folder terpisah:

```bash
sudo mkdir -p /opt/apps/sisterbridge
sudo chown -R rifqi:rifqi /opt/apps/sisterbridge
cd /opt/apps/sisterbridge
```

Jika source berasal dari Git:

```bash
git clone <URL_REPOSITORY_SISTERBRIDGE> /opt/apps/sisterbridge
cd /opt/apps/sisterbridge
```

Jika folder tersebut sudah berisi repository:

```bash
cd /opt/apps/sisterbridge
git status --short --branch
git pull --ff-only origin main
```

Jangan menjalankan `docker compose` dari `/root` jika file Compose berada di folder aplikasi. Gunakan `cd` ke folder aplikasi atau opsi `-f`:

```bash
docker compose -f /opt/apps/sisterbridge/docker-compose.yml ps
```

## 5. Docker Compose

Aplikasi dapat mempunyai beberapa service, misalnya frontend, backend, worker, scheduler, database, dan Redis.

Pola Compose untuk aplikasi yang mendengarkan port `3000` di dalam container:

```yaml
name: sisterbridge

services:
  app:
    image: <IMAGE_SISTERBRIDGE>
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "127.0.0.1:3100:3000"
    depends_on:
      database:
        condition: service_healthy

  database:
    image: <DATABASE_IMAGE>
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - sisterbridge_database:/var/lib/<database-data-directory>
    healthcheck:
      test: ["CMD-SHELL", "<DATABASE_HEALTHCHECK>"]
      interval: 10s
      timeout: 5s
      retries: 10

volumes:
  sisterbridge_database:
```

Nilai `image`, direktori data, healthcheck, dan port internal harus disesuaikan dengan image aplikasi. Jangan memakai placeholder tersebut langsung di production.

Validasi dan jalankan:

```bash
cd /opt/apps/sisterbridge
docker compose config -q
docker compose up -d
docker compose ps
docker compose logs --tail=100
```

## 6. Environment production

Simpan environment production di:

```text
/opt/apps/sisterbridge/.env
```

Atur permission:

```bash
chmod 600 /opt/apps/sisterbridge/.env
```

Contoh variabel umum:

```env
NODE_ENV=production
APP_URL=https://sisterbridge.andirifqialnur.my.id

# Gunakan nama service Docker, bukan IP public VPS.
DATABASE_URL=...
REDIS_URL=redis://redis:6379
```

Contoh PostgreSQL pada Compose yang sama:

```env
DATABASE_URL=postgresql://sisterbridge_user:password@database:5432/sisterbridge
```

Contoh MySQL pada Compose yang sama:

```env
DATABASE_URL=mysql://sisterbridge_user:password@database:3306/sisterbridge
```

Jika SisterBridge menggunakan MySQL NeoFeeder, jangan memakai database `app_deployer` atau user production App Deployer. Buat database dan user terpisah.

Compose NeoFeeder saat ini berada di:

```text
/opt/apps/brige-neofeeder/docker-compose.yml
```

Database dari Compose berbeda harus memakai network bersama atau dihubungkan ke network yang sesuai. Jangan mengandalkan IP container karena IP dapat berubah saat container dibuat ulang.

## 7. Konfigurasi Nginx

Nginx berjalan langsung di host VPS. File konfigurasi SisterBridge:

```text
/etc/nginx/sites-available/sisterbridge
```

Buat file:

```bash
sudo nano /etc/nginx/sites-available/sisterbridge
```

Sebelum HTTPS dipasang, gunakan konfigurasi HTTP sementara berikut. Ganti `3100` jika aplikasi memakai port host lain:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name sisterbridge.andirifqialnur.my.id;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
```

Aktifkan site:

```bash
sudo ln -s /etc/nginx/sites-available/sisterbridge \
  /etc/nginx/sites-enabled/sisterbridge
sudo nginx -t
sudo systemctl reload nginx
```

Tes dari VPS:

```bash
curl -i --max-time 15 http://127.0.0.1:3100
curl -i --max-time 15 http://sisterbridge.andirifqialnur.my.id
```

## 8. Pasang HTTPS

Pastikan DNS sudah mengarah ke VPS dan HTTP dapat diakses dari internet.

```bash
certbot --version
```

Jika Certbot belum tersedia:

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

Pasang sertifikat dan redirect HTTP ke HTTPS:

```bash
sudo certbot --nginx \
  -d sisterbridge.andirifqialnur.my.id \
  --redirect
```

Tes renewal:

```bash
sudo certbot renew --dry-run
```

Tes dari PowerShell:

```powershell
curl.exe -I --max-time 15 https://sisterbridge.andirifqialnur.my.id
```

Jangan memakai `curl -k` untuk menyatakan HTTPS sudah benar karena opsi tersebut melewati validasi sertifikat.

## 9. Firewall dan database

Tidak perlu membuka port baru untuk SisterBridge. Request publik masuk melalui Nginx port `80` dan `443`.

Periksa UFW:

```bash
sudo ufw status numbered
```

Jangan membuka port database dan Redis ke public:

```text
5432/tcp  jangan dibuka
3306/tcp  jangan dibuka
6379/tcp  jangan dibuka
```

Gunakan binding `127.0.0.1` untuk service yang perlu diakses host melalui Nginx, dan gunakan nama service Docker untuk komunikasi antar-container.

## 10. Migrasi dan backup database

Sebelum migrasi production:

- pastikan database dan user sudah benar;
- buat backup jika database sudah berisi data;
- pastikan container database berstatus healthy;
- jalankan migrasi sekali saja;
- simpan output jika gagal.

Jangan menjalankan perintah reset database production seperti `prisma migrate reset`, `db:reset`, atau perintah sejenis tanpa backup dan konfirmasi eksplisit.

Folder backup SisterBridge yang disarankan:

```text
/opt/apps/sisterbridge/backups
```

Jangan mencampur backup SisterBridge dengan:

```text
/opt/apps/app-deployer/backups/postgres
```

Contoh backup PostgreSQL:

```bash
mkdir -p /opt/apps/sisterbridge/backups/postgres
chmod 700 /opt/apps/sisterbridge/backups
chmod 700 /opt/apps/sisterbridge/backups/postgres

docker compose exec -T database \
  pg_dump -U <DB_USER> -d <DB_NAME> --format=custom \
  > /opt/apps/sisterbridge/backups/postgres/sisterbridge-$(date +%Y%m%d-%H%M%S).dump
```

Contoh backup MySQL:

```bash
mkdir -p /opt/apps/sisterbridge/backups/mysql

docker compose exec -T database \
  mysqldump -u<DB_USER> -p<DB_PASSWORD> <DB_NAME> \
  > /opt/apps/sisterbridge/backups/mysql/sisterbridge-$(date +%Y%m%d-%H%M%S).sql
```

Untuk backup production, jangan menaruh password di command history. Gunakan environment file dengan permission `600` atau script backup terproteksi.

## 11. Checklist deployment

### DNS dan HTTPS

- [ ] A record `sisterbridge` mengarah ke `157.119.222.101`.
- [ ] Port aplikasi tidak bentrok.
- [ ] Container aplikasi berstatus `Up`.
- [ ] Port aplikasi merespons di localhost.
- [ ] Site Nginx sudah aktif.
- [ ] `nginx -t` berhasil.
- [ ] HTTP dapat diakses.
- [ ] Sertifikat HTTPS berhasil diterbitkan.
- [ ] HTTP redirect ke HTTPS.
- [ ] HTTPS tidak menampilkan certificate warning.

### Docker dan aplikasi

- [ ] `docker compose config -q` berhasil.
- [ ] Semua service penting `Up` atau `healthy`.
- [ ] Tidak ada error fatal pada log.
- [ ] `.env` production berada di VPS dan tidak masuk Git.
- [ ] Migrasi berhasil.
- [ ] Login aplikasi berhasil.
- [ ] Fitur utama berhasil dites.
- [ ] Container otomatis hidup kembali setelah reboot.

### Database

- [ ] Database memakai user khusus SisterBridge.
- [ ] Database tidak bind ke public interface.
- [ ] Adminer bisa mengakses database jika diperlukan.
- [ ] Backup pertama berhasil.
- [ ] Restore pernah diuji pada database sementara.

## 12. Monitoring

```bash
cd /opt/apps/sisterbridge
docker compose ps
docker compose logs --tail=100
docker compose logs -f
```

Log Nginx:

```bash
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

Cek semua container dan storage:

```bash
docker ps -a
df -h /
docker system df
```

## 13. Rollback Nginx

Backup konfigurasi sebelum perubahan:

```bash
sudo cp -a /etc/nginx/sites-available/sisterbridge \
  "/etc/nginx/sites-available/sisterbridge.bak.$(date +%Y%m%d-%H%M%S)"
```

Jika konfigurasi gagal:

```bash
sudo nginx -t
sudo ls -lt /etc/nginx/sites-available/sisterbridge.bak-*
```

Pulihkan backup yang sesuai:

```bash
sudo cp /etc/nginx/sites-available/sisterbridge.bak-YYYYMMDD-HHMMSS \
  /etc/nginx/sites-available/sisterbridge
sudo nginx -t
sudo systemctl reload nginx
```

Untuk menghentikan stack aplikasi:

```bash
cd /opt/apps/sisterbridge
docker compose down
```

Jangan memakai `docker compose down -v` pada production karena dapat menghapus named volume database.

## 14. Perintah deploy berikutnya

Setelah deployment pertama selesai dan sudah diuji:

```bash
cd /opt/apps/sisterbridge
git pull --ff-only origin main
docker compose config -q
docker compose up -d
docker compose ps
docker compose logs --tail=100
sudo nginx -t
sudo systemctl reload nginx
```

Tes publik:

```bash
curl -I --max-time 15 https://sisterbridge.andirifqialnur.my.id
```

