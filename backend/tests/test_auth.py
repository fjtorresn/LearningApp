import base64
import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from sqlalchemy import text

from app import auth
from app.db import SessionLocal

ISSUER = "https://test-app.clerk.accounts.dev"
PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)


class _FakeJWKClient:
    def get_signing_key_from_jwt(self, token):
        return jwt.PyJWK.from_dict(
            {**jwt.algorithms.RSAAlgorithm.to_jwk(PRIVATE_KEY.public_key(), as_dict=True), "alg": "RS256"}
        )


@pytest.fixture(autouse=True)
def fake_clerk(monkeypatch):
    monkeypatch.setattr(auth, "_issuer", lambda: ISSUER)
    monkeypatch.setattr(auth, "_jwks_client", lambda: _FakeJWKClient())


def make_token(sub="user_real", azp="http://localhost:3000", iss=ISSUER, exp_in=60, key=PRIVATE_KEY):
    now = int(time.time())
    claims = {"sub": sub, "iss": iss, "iat": now, "nbf": now, "exp": now + exp_in, "azp": azp}
    return jwt.encode(claims, key, algorithm="RS256")


def test_frontend_api_url_from_publishable_key():
    encoded = base64.b64encode(b"test-app.clerk.accounts.dev$").decode().rstrip("=")
    assert auth.frontend_api_url(f"pk_test_{encoded}") == ISSUER


def test_requires_token(raw_client):
    r = raw_client.get("/api/topics")
    assert r.status_code == 401


def test_valid_token(raw_client):
    r = raw_client.get("/api/topics", headers={"Authorization": f"Bearer {make_token()}"})
    assert r.status_code == 200, r.text


@pytest.mark.parametrize(
    "kwargs",
    [
        {"exp_in": -60},  # caducado
        {"iss": "https://otro.clerk.accounts.dev"},  # otro emisor
        {"azp": "https://sitio-malicioso.com"},  # otro origen
        {"key": rsa.generate_private_key(public_exponent=65537, key_size=2048)},  # firma falsa
    ],
)
def test_rejects_bad_tokens(raw_client, kwargs):
    r = raw_client.get("/api/topics", headers={"Authorization": f"Bearer {make_token(**kwargs)}"})
    assert r.status_code == 401


def test_users_only_see_their_own_data(client):
    a = {"X-Test-User": "user_a"}
    b = {"X-Test-User": "user_b"}
    topic = client.post("/api/topics", json={"name": "GitHub"}, headers=a).json()
    card = client.post(
        "/api/cards", json={"title": "rebase", "topic_id": topic["id"], "tags": ["git"]}, headers=a
    ).json()

    assert client.get("/api/topics", headers=b).json() == []
    assert client.get("/api/search", params={"q": "rebase"}, headers=b).json() == []
    assert client.get("/api/tags", headers=b).json() == []
    assert client.get(f"/api/cards/{card['id']}", headers=b).status_code == 404
    assert client.patch(f"/api/topics/{topic['id']}", json={"name": "x"}, headers=b).status_code == 404
    assert client.delete(f"/api/cards/{card['id']}", headers=b).status_code == 404
    # No puede crear tarjetas en el tema de otro.
    assert client.post("/api/cards", json={"title": "x", "topic_id": topic["id"]}, headers=b).status_code == 422

    # Los nombres de tema y tag son únicos por usuario, no globales.
    t_b = client.post("/api/topics", json={"name": "GitHub"}, headers=b)
    assert t_b.status_code == 201
    client.post("/api/cards", json={"title": "merge", "topic_id": t_b.json()["id"], "tags": ["git"]}, headers=b)
    assert [h["title"] for h in client.get("/api/search", params={"q": "git"}, headers=b).json()] == ["merge"]
    assert [h["title"] for h in client.get("/api/search", params={"tags": "git"}, headers=a).json()] == ["rebase"]


def test_first_user_claims_existing_data(client):
    # Datos creados antes de que existieran usuarios (user_id NULL).
    with SessionLocal() as db:
        db.execute(text("INSERT INTO topics (name, description, color, created_at) VALUES ('Viejo', '', 'blue', '2026-01-01')"))
        db.commit()

    assert [t["name"] for t in client.get("/api/topics", headers={"X-Test-User": "primero"}).json()] == ["Viejo"]
    assert client.get("/api/topics", headers={"X-Test-User": "segundo"}).json() == []
