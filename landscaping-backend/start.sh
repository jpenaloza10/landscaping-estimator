#!/usr/bin/env bash
set -euo pipefail

echo "start.sh: launching API"
node -v || true
npm -v || true

# Print PORT for sanity
echo "PORT=${PORT:-unset}"


echo "Starting API..."
exec node dist/index.js
