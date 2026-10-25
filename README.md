# LearningApp

Base de conocimiento personal: organiza los conceptos y tecnologías que vas aprendiendo en **temas** y **tarjetas** con **tags**, y encuéntralos al instante con el buscador (**Ctrl+K**).

## Arrancar

Requisitos: [uv](https://docs.astral.sh/uv/) y Node.js 20+.

1. **Claves de Clerk** (login con Google). En `frontend/` ejecuta `npx clerk init` (o copia tus claves del
   [dashboard de Clerk](https://dashboard.clerk.com/) a `frontend/.env.local`).
2. Copia `backend/.env.example` a `backend/.env` y pon la misma *publishable key* (`pk_test_…`).
3. Arranca todo:

```bash
./dev.sh
```

Abre http://localhost:3000 e inicia sesión con Google. La documentación interactiva de la API está en http://localhost:8765/docs.

## Usuarios

- El login lo gestiona **Clerk**. Cada usuario solo ve sus propios temas, tarjetas y tags.
- El frontend envía el token de sesión (`Authorization: Bearer …`) y FastAPI lo verifica con las claves
  públicas de Clerk (`backend/app/auth.py`): no necesita la secret key.
- Los datos creados antes de añadir usuarios pasan al **primer usuario** que inicia sesión.

## Móvil (PWA)

- En pantallas pequeñas la app usa una barra de navegación inferior y un buscador a pantalla completa.
- **Desde el móvil en tu wifi:** abre `http://<IP-de-tu-PC>:3000` y añade ese origen a
  `CLERK_AUTHORIZED_PARTIES` en `backend/.env` (separado por comas).
- **Instalarla como app** requiere HTTPS (o `localhost`). En el PC: `npm run build && npm start` en `frontend/`
  y luego "Instalar app" en Chrome. En el móvil podrás instalarla cuando esté desplegada con HTTPS.
- El *service worker* (`frontend/public/sw.js`) guarda las últimas tarjetas vistas para consultarlas sin
  conexión. Solo se activa en producción.

## Usarla desde el celular con Tailscale (gratis)

La app corre en tu PC y el celular accede a ella por una red privada de [Tailscale](https://tailscale.com/),
con HTTPS (necesario para instalarla como app). Solo tus dispositivos pueden abrirla.

1. Instala Tailscale en el PC (`curl -fsSL https://tailscale.com/install.sh | sh` y
   `sudo tailscale up --operator=$USER`) y en el celular, con la misma cuenta.
2. Publica la app en tu red: `tailscale serve --bg 3000` (la primera vez te pedirá activar Serve/HTTPS).
3. Añade la dirección que muestra (`https://<tu-pc>.<tu-red>.ts.net`) a `CLERK_AUTHORIZED_PARTIES` en `backend/.env`.
4. Arranque automático al encender el PC (servicio de systemd que ejecuta `start.sh` en modo producción):

```bash
./deploy/install-service.sh
```

Comandos útiles: `systemctl --user status learningapp`, `journalctl --user -u learningapp -f` y, tras cambiar
el código, `systemctl --user restart learningapp` (recompila el frontend si hace falta).

> El PC debe estar encendido. Sin conexión, la app instalada muestra las tarjetas que ya habías abierto.

## Tema

Selector Claro / Oscuro / Sistema en la cabecera. Se guarda en el navegador.

¿Quieres tarjetas de ejemplo (sobre las tecnologías de esta misma app)? Con la base de datos vacía:

```bash
cd backend && uv run python -m app.seed
```

## Atajos

| Atajo | Acción |
|---|---|
| `Ctrl+K` / `Cmd+K` | Abrir el buscador rápido |
| `↑` `↓` `Enter` | Navegar y abrir resultados |
| `e` | Editar la tarjeta abierta |
| `Ctrl+Enter` | Guardar el formulario de tarjeta |

## Fórmulas matemáticas

Las tarjetas aceptan LaTeX (renderizado con [KaTeX](https://katex.org/)): `$x^2$` dentro del texto y
`$$…$$` para ecuaciones en su propia línea, incluidas matrices:

```latex
$$
A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}
$$
```

## Cómo funciona la búsqueda

- Busca en **título, contenido y tags** a la vez, por **prefijo** (`sqlal` encuentra *SQLAlchemy*) y **sin importar tildes** (`migracion` encuentra *migración*).
- Si escribes varias palabras, la tarjeta debe contener **todas**.
- Las coincidencias en el título pesan más que en los tags, y estas más que en el contenido.
- En `/search` puedes combinar el texto con filtros por **tema** y por **tags** (deben cumplirse todos los tags elegidos).

## Estructura

```
backend/                 FastAPI + SQLAlchemy + Alembic + SQLite
  app/models.py          User 1─N Topic 1─N Card N─N Tag
  app/auth.py            Verificación del token de Clerk
  app/search.py          Búsqueda full-text con SQLite FTS5
  app/routers/           Endpoints /api/topics, /api/cards, /api/tags, /api/search
  alembic/versions/      Migraciones del esquema
  data/learningapp.db    Tu base de datos (no se sube a git: haz copia)
  tests/                 uv run pytest
frontend/                Next.js (App Router) + Tailwind
  src/app/               Páginas: /, /topics/[id], /cards/[id], /cards/new, /search
  src/components/        AppShell, CommandPalette (Ctrl+K), SearchView, CardForm…
  next.config.ts         Proxy /api/* → http://localhost:8765
```

## Tareas habituales

```bash
# Tests del backend
cd backend && uv run pytest

# Cambiaste un modelo → nueva migración
cd backend && uv run alembic revision --autogenerate -m "descripción"
cd backend && uv run alembic upgrade head

# Lint del frontend
cd frontend && npm run lint
```

## Copia de seguridad

Todo está en `backend/data/learningapp.db` (un solo archivo SQLite). Cópialo para hacer un respaldo.
