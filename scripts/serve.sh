#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

APP_HOST="${APP_HOST:-0.0.0.0}"
APP_PORT="${APP_PORT:-9000}"

if [[ ! -f ".env" ]]; then
  cp .env.example .env
  if command -v openssl >/dev/null 2>&1; then
    SECRET="$(openssl rand -hex 32)"
    if command -v perl >/dev/null 2>&1; then
      perl -0pi -e "s/AUTH_SECRET=\"replace-with-a-long-random-secret\"/AUTH_SECRET=\"$SECRET\"/" .env
    fi
  fi
  echo "Created .env from .env.example. Edit NEXTAUTH_URL before public operation."
fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  docker compose up -d postgres
else
  echo "Docker is unavailable. PostgreSQL must already be running for DATABASE_URL." >&2
fi

npm install
npm run prisma:generate
npm run db:push
npm run db:seed
npm run build

echo "Starting app on http://${APP_HOST}:${APP_PORT}"
exec npm run start -- --hostname "$APP_HOST" --port "$APP_PORT"
