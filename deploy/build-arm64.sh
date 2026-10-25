#!/usr/bin/env bash
# Compila en el PC las imágenes de LearningApp para la Raspberry Pi (linux/arm64) y las guarda
# en dist/learningapp-arm64.tar.gz, listas para copiar a la Pi:
#
#   ./deploy/build-arm64.sh
#   scp dist/learningapp-arm64.tar.gz pi@<ip-de-la-pi>:~/LearningApp/dist/
#   (en la Pi)  docker load -i dist/learningapp-arm64.tar.gz && docker compose up -d
#
# No necesita emulación: los Dockerfiles hacen el trabajo pesado en la arquitectura del PC.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p dist

[ -f frontend/.env.local ] || { echo "Falta frontend/.env.local (claves de Clerk)"; exit 1; }

echo "→ backend (arm64)"
docker buildx build --platform linux/arm64 -t learningapp-backend:latest \
  -o type=docker,dest=dist/backend-arm64.tar backend

echo "→ frontend (arm64)"
docker buildx build --platform linux/arm64 -t learningapp-frontend:latest \
  --secret id=frontend_env,src=frontend/.env.local \
  -o type=docker,dest=dist/frontend-arm64.tar frontend

# Un solo archivo comprimido con las dos imágenes.
tar -C dist -cf - backend-arm64.tar frontend-arm64.tar | gzip -1 > dist/learningapp-arm64.tar.gz
rm dist/backend-arm64.tar dist/frontend-arm64.tar
ls -lh dist/learningapp-arm64.tar.gz
