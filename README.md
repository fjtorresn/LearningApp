# LearningApp

Base de conocimiento personal: organiza los conceptos y tecnologías que vas aprendiendo en **temas** y **tarjetas** con **tags**, y encuéntralos al instante con el buscador (**Ctrl+K**).

## Arrancar

Requisitos: [uv](https://docs.astral.sh/uv/) y Node.js 20+.

```bash
./dev.sh
```

Abre http://localhost:3000. La documentación interactiva de la API está en http://localhost:8765/docs.

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

## Cómo funciona la búsqueda

- Busca en **título, contenido y tags** a la vez, por **prefijo** (`sqlal` encuentra *SQLAlchemy*) y **sin importar tildes** (`migracion` encuentra *migración*).
- Si escribes varias palabras, la tarjeta debe contener **todas**.
- Las coincidencias en el título pesan más que en los tags, y estas más que en el contenido.
- En `/search` puedes combinar el texto con filtros por **tema** y por **tags** (deben cumplirse todos los tags elegidos).

## Estructura

```
backend/                 FastAPI + SQLAlchemy + Alembic + SQLite
  app/models.py          Topic 1─N Card N─N Tag
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
