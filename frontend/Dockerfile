# syntax=docker/dockerfile:1
# Imagen del frontend (Next.js). Funciona en amd64 (PC) y arm64 (Raspberry Pi).
#
# npm install y `next build` corren en la arquitectura del PC ($BUILDPLATFORM): el resultado
# es JavaScript, igual para cualquier procesador. La etapa final solo copia ese resultado.

FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# El proxy /api/* apunta al contenedor del backend. Se fija al compilar (rewrites de next.config.ts).
ARG API_URL=http://backend:8765
ENV API_URL=$API_URL NEXT_OUTPUT=standalone
# .env.local entra como "secret" solo durante la compilación (Next necesita las NEXT_PUBLIC_*):
# no queda guardado en ninguna capa de la imagen.
RUN --mount=type=secret,id=frontend_env,target=/app/.env.local,required=true npm run build \
 # sharp (binario nativo compilado para el procesador del PC) no se usa: images.unoptimized en next.config.ts.
 && rm -rf .next/standalone/node_modules/@img .next/standalone/node_modules/sharp \
 # Comprobación: la imagen final no debe contener módulos nativos (no funcionarían en la Pi).
 && ! find .next/standalone -name "*.node" | grep .

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
# "standalone" = servidor mínimo con solo los node_modules que la app usa de verdad.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
