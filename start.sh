#!/usr/bin/env bash
# Arranca LearningApp en modo PRODUCCIÓN (para usarla desde el celular vía Tailscale).
#   - Compila el frontend si hay cambios desde la última compilación.
#   - Escucha solo en 127.0.0.1: desde fuera solo se llega a través de `tailscale serve` (HTTPS).
# Ctrl+C detiene ambos servidores.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

(cd "$ROOT/backend" && uv sync -q && uv run alembic upgrade head)

cd "$ROOT/frontend"
[ -d node_modules ] || npm install
BUILD_STAMP=".next/BUILD_ID"
if [ ! -f "$BUILD_STAMP" ] || [ -n "$(find src public next.config.ts package.json .env.local -newer "$BUILD_STAMP" -print -quit 2>/dev/null)" ]; then
  echo "Compilando el frontend…"
  npm run build
fi

trap 'kill 0' EXIT INT TERM
(cd "$ROOT/backend" && uv run uvicorn app.main:app --host 127.0.0.1 --port 8765) &
(cd "$ROOT/frontend" && npm start -- --hostname localhost --port 3000) &
wait
