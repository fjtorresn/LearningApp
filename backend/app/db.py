"""Conexión a la base de datos (SQLite) y sesión de SQLAlchemy."""

import os
from collections.abc import Iterator
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "data" / "learningapp.db"

# Se puede sobrescribir con una variable de entorno (los tests usan una BD temporal).
DATABASE_URL = os.getenv("LEARNINGAPP_DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

if DATABASE_URL == f"sqlite:///{DEFAULT_DB_PATH}":
    DEFAULT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _record) -> None:
    # SQLite no aplica las claves foráneas (ni ON DELETE CASCADE) si no se activa esto.
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    """Dependencia de FastAPI: una sesión por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
