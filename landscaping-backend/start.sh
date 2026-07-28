#!/usr/bin/env bash
set -euo pipefail

echo "start.sh: launching API"
node -v || true
npm -v || true

# Print PORT for sanity
echo "PORT=${PORT:-unset}"

# Apply any pending database migrations before booting.
# Without this the schema drifts behind the code and queries fail with
# "column does not exist" (P2022) at runtime.
#
# Non-fatal by design: migrations run over DIRECT_URL, which may be
# unreachable from this host even when the app's pooled DATABASE_URL is
# fine. A migration failure must never keep the API from booting — it is
# logged loudly instead, and can be applied manually.
echo "Applying database migrations..."
if npx prisma migrate deploy; then
  echo "Migrations applied."
else
  echo "WARNING: prisma migrate deploy failed — booting anyway."
  echo "WARNING: schema may lag the code; apply pending migrations manually."
fi

echo "Starting API..."
exec node dist/index.js
