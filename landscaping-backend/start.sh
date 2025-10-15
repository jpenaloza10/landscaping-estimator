#!/usr/bin/env bash
set -euo pipefail

echo "start.sh: launching API"
node -v || true
npm -v || true

# Print PORT for sanity (Render sets this)
echo "PORT=${PORT:-unset}"

# Start the server right away so Render detects the open port
exec node dist/index.js
