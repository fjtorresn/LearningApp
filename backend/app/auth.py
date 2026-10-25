"""Autenticación: verifica el token de sesión de Clerk que envía el frontend.

El frontend manda `Authorization: Bearer <token>`. El token es un JWT firmado por Clerk
(RS256). Lo verificamos con las claves públicas de Clerk (JWKS), así que el backend
solo necesita la *publishable key* (pública), nunca la secret key.
"""

import base64
import os
from functools import lru_cache
from pathlib import Path

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Card, Tag, Topic, User

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Orígenes desde los que se acepta un token (claim "azp"). Separados por comas.
AUTHORIZED_PARTIES = [
    p.strip() for p in os.getenv("CLERK_AUTHORIZED_PARTIES", "http://localhost:3000").split(",") if p.strip()
]


def frontend_api_url(publishable_key: str) -> str:
    """'pk_test_<base64("xxx.clerk.accounts.dev$")>' -> 'https://xxx.clerk.accounts.dev'"""
    encoded = publishable_key.split("_", 2)[2]
    domain = base64.b64decode(encoded + "=" * (-len(encoded) % 4)).decode().rstrip("$")
    return f"https://{domain}"


@lru_cache
def _issuer() -> str:
    key = os.getenv("CLERK_PUBLISHABLE_KEY")
    if not key:
        raise RuntimeError("Falta CLERK_PUBLISHABLE_KEY en backend/.env")
    return frontend_api_url(key)


@lru_cache
def _jwks_client() -> jwt.PyJWKClient:
    # Descarga y cachea las claves públicas de Clerk.
    return jwt.PyJWKClient(f"{_issuer()}/.well-known/jwks.json", cache_keys=True)


def verify_session_token(token: str) -> str:
    """Devuelve el id de usuario de Clerk ("sub") si el token es válido."""
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=_issuer(),
            options={"require": ["exp", "iat", "sub"]},
            leeway=5,  # tolera pequeñas diferencias de reloj
        )
    except jwt.PyJWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Token inválido: {e}") from e
    azp = claims.get("azp")
    if azp and azp not in AUTHORIZED_PARTIES:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Origen no autorizado: {azp}")
    return claims["sub"]


def get_clerk_user_id(request: Request) -> str:
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Inicia sesión para continuar")
    return verify_session_token(token)


def get_current_user(clerk_id: str = Depends(get_clerk_user_id), db: Session = Depends(get_db)) -> User:
    """Dependencia de FastAPI: el usuario de la base de datos (se crea en su primer acceso)."""
    user = db.scalar(select(User).where(User.clerk_id == clerk_id))
    if user is None:
        is_first_user = db.scalar(select(User.id).limit(1)) is None
        user = User(clerk_id=clerk_id)
        db.add(user)
        db.flush()
        if is_first_user:
            # Los datos creados antes de existir usuarios pasan a ser del primero que entra.
            for model in (Topic, Card, Tag):
                db.execute(update(model).where(model.user_id.is_(None)).values(user_id=user.id))
        db.commit()
    return user
