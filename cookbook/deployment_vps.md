# Deployment VPS SisterBridge

Dokumen ini adalah runbook deployment untuk repository ini. Target directory
yang digunakan pada VPS adalah `/opt/apps/sisterbridge`.

## Arsitektur container

```text
Nginx HTTPS di host
        |
127.0.0.1:${WEB_HOST_PORT}
        |
web container :3000 --- postgres container :5432
```

- PostgreSQL tidak diekspos ke jaringan publik; port host hanya bind ke
  `127.0.0.1`.
- Web container memakai Next.js standalone dan menjalankan
  `prisma migrate deploy` sebelum server dimulai.
- `SISTER_FIXTURE_MODE` dipaksa `false` oleh Compose dan juga ditolak oleh
  guard production di aplikasi.
- `.env` hanya dibaca oleh Compose di VPS; file tersebut tidak masuk build
  context karena tercantum di `.dockerignore`.

## File deployment

- `Dockerfile` — multi-stage Bun image dengan Next standalone.
- `docker-compose.yml` — PostgreSQL 17 dan web, termasuk healthcheck DB.
- `.dockerignore` — mengeluarkan credential, PDF, dependency lokal, dan output
  build dari image context.
- `.env.example` — template variable lokal dan Docker.

## Persiapan pertama di VPS

Pastikan Docker Engine dan Docker Compose plugin sudah tersedia, lalu:

```bash
sudo mkdir -p /opt/apps/sisterbridge
sudo chown -R "$USER":"$USER" /opt/apps/sisterbridge
cd /opt/apps/sisterbridge
git clone <URL_REPOSITORY> .
cp .env.example .env
chmod 600 .env
```

Edit `.env` dan isi sekurang-kurangnya:

```dotenv
POSTGRES_DB=sister_integrated
POSTGRES_USER=sister_app
POSTGRES_PASSWORD=<password-random-tanpa-spasi>
DATABASE_URL_DOCKER=postgresql://sister_app:<password-yang-di-url-encode>@postgres:5432/sister_integrated?schema=public

APP_URL=https://sisterbridge.example.com
APP_ALLOWED_ORIGINS=https://sisterbridge.example.com
TRUST_PROXY=true
SESSION_SECRET=<random-secret-minimal-32-byte>

SISTER_BASE_URL=https://<instance-sister-resmi>/
SISTER_ID_PENGGUNA=<id-pengguna-uat>
SISTER_INTEGRATION_ID=<uuid-integrasi-lokal>
SISTER_USERNAME=<username-uat>
SISTER_PASSWORD=<password-uat>
SISTER_CREDENTIAL_REF=<referensi-secret>
SISTER_FIXTURE_MODE=false
```

Jika password PostgreSQL memiliki karakter khusus, gunakan nilai yang sudah
di-URL-encode pada `DATABASE_URL_DOCKER`, atau gunakan password alfanumerik
acak untuk instalasi pertama.

## Port host

Container selalu listen pada port `3000`. Port host dapat diatur pada Compose
agar tidak bertabrakan dengan aplikasi lain:

```yaml
ports:
  - "127.0.0.1:${WEB_HOST_PORT:-3100}:3000"
```

Default deployment VPS memakai port host `3100` agar tidak bertabrakan dengan
service lain yang sudah menggunakan port `3000`. Jika perlu port lain, ubah
`WEB_HOST_PORT` di `.env` dan sesuaikan Nginx.

## Validasi konfigurasi dan start

```bash
cd /opt/apps/sisterbridge
docker compose --env-file .env config
docker compose --env-file .env up -d --build
docker compose ps
docker compose logs -f web
```

Smoke check dari VPS:

```bash
curl -I http://127.0.0.1:${WEB_HOST_PORT:-3100}/
docker compose exec web bun run prisma:migrate:status
```

Jangan menjalankan `docker compose down -v` kecuali memang ingin menghapus
volume PostgreSQL dan seluruh data lokal.

## Update release

```bash
cd /opt/apps/sisterbridge
git pull --ff-only
docker compose --env-file .env up -d --build
docker compose ps
docker compose logs --tail=100 web
```

Migration dijalankan otomatis saat container web start. Migration Prisma
bersifat versioned dan tidak mengubah database SISTER eksternal.

## Nginx minimum

Nginx host harus meneruskan HTTPS ke port localhost container dan mengirim
header proxy berikut:

```nginx
location / {
    proxy_pass http://127.0.0.1:3100;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Aktifkan HTTPS sebelum memasukkan credential SISTER production/UAT. Nilai
`APP_URL` dan `APP_ALLOWED_ORIGINS` harus sama dengan origin HTTPS yang dipakai
browser.

## Batasan deployment saat ini

- Auth/session production belum memiliki provider login nyata; fixture user
  sengaja dinonaktifkan di production.
- Credential SISTER UAT/live, base URL, dan YAML resmi masih menjadi gate
  kontrak eksternal.
- Build Docker belum dapat dijalankan pada workstation ini karena Docker CLI
  tidak terpasang; validasi final `docker compose config` dan image build harus
  dilakukan di VPS atau CI yang memiliki Docker.
