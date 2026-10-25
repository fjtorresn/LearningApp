import os
import tempfile
from pathlib import Path

# Debe definirse ANTES de importar app.db, que lee la URL al importarse.
_tmpdir = tempfile.mkdtemp()
os.environ["LEARNINGAPP_DATABASE_URL"] = f"sqlite:///{Path(_tmpdir) / 'test.db'}"

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

BACKEND_DIR = Path(__file__).resolve().parent.parent


@pytest.fixture()
def client():
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    command.upgrade(cfg, "head")
    with TestClient(app) as c:
        yield c
    command.downgrade(cfg, "base")
