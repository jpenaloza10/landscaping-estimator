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
echo "Applying database migrations..."
npx prisma migrate deploy

echo "Starting API..."
exec node dist/index.js
