"""Carga tarjetas de ejemplo (sobre las tecnologías de esta misma app).

Uso:  uv run python -m app.seed
Solo hace algo si la base de datos está vacía.
"""

from sqlalchemy import func, select

from app.db import SessionLocal
from app.models import Card, Topic
from app.search import index_card
from app.tags import get_or_create_tags

SEED = [
    {
        "name": "Backend-Python",
        "description": "APIs, ORM y herramientas del backend en Python",
        "color": "green",
        "cards": [
            {
                "title": "SQLAlchemy",
                "tags": ["orm", "base-de-datos"],
                "content": """ORM (Object Relational Mapper) de Python: defines tablas como **clases** y trabajas con objetos en lugar de SQL a mano.

**Cuándo se usa:** cada vez que el backend lee o escribe en la base de datos.

```python
class Card(Base):
    __tablename__ = "cards"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))

card = db.get(Card, 1)
db.scalars(select(Card).where(Card.title == "alembic"))
```

- `Session`: la "unidad de trabajo"; acumulas cambios y haces `db.commit()`.
- `relationship()`: navega entre tablas (`card.topic`, `topic.cards`).""",
            },
            {
                "title": "Alembic",
                "tags": ["migraciones", "base-de-datos"],
                "content": """Herramienta de **migraciones** para SQLAlchemy: versiona los cambios del esquema de la base de datos (como git, pero para tablas).

**Flujo de trabajo:**
1. Cambias un modelo en `models.py`.
2. Generas la migración:
   ```bash
   uv run alembic revision --autogenerate -m "añadir columna x"
   ```
3. **Revisas** el archivo generado en `alembic/versions/` (el autogenerate no es perfecto).
4. Aplicas: `uv run alembic upgrade head`

Deshacer la última: `uv run alembic downgrade -1`""",
            },
            {
                "title": "FastAPI",
                "tags": ["api", "framework"],
                "content": """Framework web para construir APIs en Python usando *type hints*. Valida datos con Pydantic y genera documentación automática en `/docs`.

```python
@router.get("/cards/{card_id}", response_model=CardOut)
def get_card(card_id: int, db: Session = Depends(get_db)):
    ...
```

- `Depends(...)`: **inyección de dependencias** (p. ej. una sesión de BD por request).
- `response_model`: filtra y valida lo que se devuelve.""",
            },
            {
                "title": "uv",
                "tags": ["tooling", "dependencias"],
                "content": """Gestor de proyectos y dependencias de Python (reemplaza pip + venv + pip-tools). Muy rápido.

```bash
uv add fastapi          # añade dependencia (pyproject.toml + uv.lock)
uv add --dev pytest     # dependencia solo de desarrollo
uv sync                 # instala todo según uv.lock
uv run pytest           # ejecuta dentro del entorno virtual
```""",
            },
        ],
    },
    {
        "name": "Frontend-NextJS",
        "description": "React, Next.js y estilos",
        "color": "purple",
        "cards": [
            {
                "title": "App Router",
                "tags": ["routing", "nextjs"],
                "content": """Sistema de rutas de Next.js basado en carpetas dentro de `src/app/`.

| Archivo | Ruta |
|---|---|
| `app/page.tsx` | `/` |
| `app/topics/[id]/page.tsx` | `/topics/123` |
| `app/layout.tsx` | layout compartido |

Los componentes son **Server Components** por defecto; añade `"use client"` arriba del archivo si usas estado (`useState`) o eventos.""",
            },
            {
                "title": "rewrites (proxy a la API)",
                "tags": ["nextjs", "api", "configuracion"],
                "content": """En `next.config.ts`, `rewrites` redirige rutas del frontend a otro servidor sin que el navegador lo note. Evita problemas de **CORS** en desarrollo.

```ts
async rewrites() {
  return [{ source: "/api/:path*", destination: "http://localhost:8000/api/:path*" }];
}
```""",
            },
        ],
    },
    {
        "name": "GitHub",
        "description": "Git, ramas y colaboración",
        "color": "orange",
        "cards": [
            {
                "title": "Pull Request",
                "tags": ["git", "colaboracion"],
                "content": """Propuesta para fusionar una rama en otra (normalmente en `main`), con revisión y CI antes del merge.

```bash
git switch -c feature/buscador
git add . && git commit -m "Añadir buscador"
git push -u origin feature/buscador
gh pr create --fill
```""",
            },
        ],
    },
]


def seed() -> None:
    with SessionLocal() as db:
        if db.scalar(select(func.count(Topic.id))):
            print("La base de datos ya tiene datos; no se carga el seed.")
            return
        for t in SEED:
            topic = Topic(name=t["name"], description=t["description"], color=t["color"])
            db.add(topic)
            for c in t["cards"]:
                card = Card(title=c["title"], content=c["content"], topic=topic)
                card.tags = get_or_create_tags(db, c["tags"])
                db.add(card)
                db.flush()
                index_card(db, card)
        db.commit()
        print(f"Seed cargado: {len(SEED)} temas.")


if __name__ == "__main__":
    seed()
