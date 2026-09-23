#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_BRANCH="${GIT_BRANCH:-main}"

if [[ ! -d .git ]]; then
  echo "This script must be run from a Git repository." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Production .env is required beside deploy.sh." >&2
  echo "Copy .env.example to .env and fill in the production values first." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but was not found." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin is required but was not found." >&2
  exit 1
fi

compose() {
  docker compose --env-file .env -f "$COMPOSE_FILE" "$@"
}

echo "Pulling latest code from ${GIT_REMOTE}/${GIT_BRANCH} ..."
git pull --ff-only "$GIT_REMOTE" "$GIT_BRANCH"

echo "Validating Docker Compose configuration ..."
compose config >/dev/null

echo "Building web image ..."
compose build web

echo "Starting database ..."
compose up -d postgres

echo "Waiting for database readiness ..."
for attempt in {1..30}; do
  if compose exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; then
    echo "Database is ready."
    break
  fi

  if [[ "$attempt" -eq 30 ]]; then
    echo "Database did not become ready in time." >&2
    compose logs --tail=80 postgres >&2
    exit 1
  fi

  sleep 2
done

echo "Running database migrations ..."
compose run --rm --no-deps web bunx prisma migrate deploy

echo "Starting application ..."
compose up -d --remove-orphans

echo "Current containers:"
compose ps

echo "Recent web logs:"
compose logs --tail=80 web
