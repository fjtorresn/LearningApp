import os
import tempfile
from pathlib import Path

# Debe definirse ANTES de importar app.db, que lee la URL al importarse.
_tmpdir = tempfile.mkdtemp()
os.environ["LEARNINGAPP_DATABASE_URL"] = f"sqlite:///{Path(_tmpdir) / 'test.db'}"

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi import Request  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.auth import get_clerk_user_id  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402

BACKEND_DIR = Path(__file__).resolve().parent.parent


def _fake_clerk_user(request: Request) -> str:
    # En los tests no hay Clerk: el usuario se elige con una cabecera (por defecto "user_a").
    return request.headers.get("X-Test-User", "user_a")


@pytest.fixture()
def migrated_db():
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    command.upgrade(cfg, "head")
    yield
    # Vaciar antes de bajar: el downgrade restaura UNIQUE(name) global, que podría no cumplirse.
    with SessionLocal() as db:
        for table in ("card_tags", "cards_fts", "cards", "tags", "topics", "users"):
            db.execute(text(f"DELETE FROM {table}"))
        db.commit()
    command.downgrade(cfg, "base")


@pytest.fixture()
def client(migrated_db):
    app.dependency_overrides[get_clerk_user_id] = _fake_clerk_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def raw_client(migrated_db):
    """Cliente SIN el override: pasa por la verificación real del token."""
    with TestClient(app) as c:
        yield c
