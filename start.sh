#!/usr/bin/env bash
# Start Brand OS v2 locally with a live-reloading preview.
# Usage: ./start.sh            (port 3000, or the next free one)
#        PORT=3001 ./start.sh
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install Node 20+ (https://nodejs.org) and run again." >&2
  exit 1
fi

if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -f .env.local ]; then
  echo "Warning: .env.local is missing, so the AI features will not work."
  echo "         Pull the keys from Vercel with:  vercel env pull .env.local"
fi

port="${PORT:-3000}"
while lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
  port=$((port + 1))
done

echo ""
echo "  Brand OS v2 local preview"
echo "  Home:    http://localhost:$port"
echo "  Studio:  http://localhost:$port/create"
echo ""

exec npx next dev --port "$port"
