#!/usr/bin/env bash
# Arranca backend (FastAPI :8765) y frontend (Next.js :3000). Ctrl+C detiene ambos.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

(cd "$ROOT/backend" && uv sync -q && uv run alembic upgrade head)
[ -d "$ROOT/frontend/node_modules" ] || (cd "$ROOT/frontend" && npm install)

trap 'kill 0' EXIT INT TERM
(cd "$ROOT/backend" && uv run uvicorn app.main:app --reload --port 8765) &
(cd "$ROOT/frontend" && npm run dev) &
wait
