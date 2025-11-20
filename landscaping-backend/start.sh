#!/usr/bin/env bash
set -euo pipefail

echo "start.sh: launching API"
node -v || true
npm -v || true
echo "PORT=${PORT:-unset}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set. Aborting." >&2
  exit 1
fi

# Don’t block port binding. Kick off migrate in the background with a few retries.
(
  echo "[migrate] starting in background…"
  tries=0
  max=6
  until npx prisma migrate deploy; do
    tries=$((tries+1))
    if [[ $tries -ge $max ]]; then
      echo "[migrate] failed after $tries attempts — continuing without blocking server. Check logs."
      break
    fi
    echo "[migrate] attempt $tries failed; retrying in 5s…"
    sleep 5
  done
  echo "[migrate] done."
) &

# If you didn’t already run `prisma generate` during build, uncomment:
# npx prisma generate &

echo "Starting API…"
exec node dist/index.js
