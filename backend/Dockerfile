# syntax=docker/dockerfile:1
# Imagen del backend (FastAPI). Funciona en amd64 (PC) y arm64 (Raspberry Pi).
#
# Truco para compilar para la Pi desde el PC sin emulación: la etapa "deps" corre en la
# arquitectura del PC ($BUILDPLATFORM) y uv descarga las wheels de la arquitectura destino
# ($TARGETARCH). La etapa final solo COPIA archivos, así que no ejecuta nada de otra arquitectura.

# uv como etapa propia fijada a la arquitectura del PC: con `COPY --from=<imagen>` Docker
# traería el binario de la arquitectura destino, que el PC no puede ejecutar.
FROM --platform=$BUILDPLATFORM ghcr.io/astral-sh/uv:0.13.5 AS uv

FROM --platform=$BUILDPLATFORM python:3.10-slim-bookworm AS deps
COPY --from=uv /uv /usr/local/bin/uv
ARG TARGETARCH
WORKDIR /build
COPY pyproject.toml uv.lock ./
RUN case "$TARGETARCH" in \
      amd64) PLATFORM=x86_64-manylinux_2_28 ;; \
      arm64) PLATFORM=aarch64-manylinux_2_28 ;; \
      *) echo "Arquitectura no soportada: $TARGETARCH" && exit 1 ;; \
    esac \
 && uv export --frozen --no-dev --no-hashes --no-emit-project -o requirements.txt \
 && uv pip install --target /deps --python-version 3.10 --python-platform "$PLATFORM" \
      --only-binary :all: -r requirements.txt \
 # Carpeta de datos con dueño UID 1000 (el usuario sin privilegios de la imagen final).
 && mkdir -p /data && chown 1000:1000 /data

FROM python:3.10-slim-bookworm
WORKDIR /app
COPY --from=deps /deps /app/deps
COPY --from=deps --chown=1000:1000 /data /data
COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app

ENV PYTHONPATH=/app/deps:/app \
    PYTHONUNBUFFERED=1 \
    LEARNINGAPP_DATABASE_URL=sqlite:////data/learningapp.db

# Sin privilegios de root. UID 1000 = el usuario normal en Ubuntu y en Raspberry Pi OS,
# así puede escribir en la carpeta de datos montada desde el host.
USER 1000:1000
VOLUME ["/data"]
EXPOSE 8765

# Aplica las migraciones pendientes y arranca la API.
CMD ["sh", "-c", "python -m alembic upgrade head && exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8765"]
