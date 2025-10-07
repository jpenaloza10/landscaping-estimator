#!/usr/bin/env bash
set -euo pipefail
set -x

echo "start.sh: launched"
node -v || true
npm -v || true

DB_HOST="$(node -e 'try{const u=new URL(process.env.DATABASE_URL||"");console.log(u.hostname)}catch{console.log("")}')"
DB_PORT="$(node -e 'try{const u=new URL(process.env.DATABASE_URL||"");console.log(u.port||"5432")}catch{console.log("5432")}')"
echo "DB host: ${DB_HOST}:${DB_PORT}"

# ---------- 1) TCP wait (<= ~180s total) ----------
MAX_TRIES=60
SLEEP=3
i=1
while [ $i -le $MAX_TRIES ]; do
  if (echo > /dev/tcp/${DB_HOST}/${DB_PORT}) >/dev/null 2>&1; then
    echo "DB TCP reachable on try $i"
    DB_READY=1
    break
  fi
  echo "DB not reachable yet (try $i/${MAX_TRIES}); sleeping ${SLEEP}s..."
  sleep $SLEEP
  i=$((i+1))
done

if [ -z "${DB_READY:-}" ]; then
  echo "WARN: DB still not reachable after ${MAX_TRIES} tries. Skipping migrations and starting API anyway..."
  echo "You can run migrations later from your laptop once the DB wakes."
  exec node dist/index.js
fi

# ---------- 2) Run migrations with retries (if DB is reachable) ----------
RETRIES=8
SLEEP=6
set +e
i=1
while [ $i -le $RETRIES ]; do
  echo "Attempt $i: prisma migrate deploy..."
  npx prisma migrate deploy && OK=1 && break
  echo "Attempt $i failed; sleeping ${SLEEP}s..."
  sleep $SLEEP
  i=$((i+1))
done

if [ -z "${OK:-}" ]; then
  echo "migrate deploy failed after retries; trying prisma db push once..."
  npx prisma db push || { echo "db push failed; starting API anyway"; }
fi

set -e
echo "Starting server..."
exec node dist/index.js
