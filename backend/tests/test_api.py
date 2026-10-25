def _topic(client, name="Backend-Python", **kw):
    r = client.post("/api/topics", json={"name": name, **kw})
    assert r.status_code == 201, r.text
    return r.json()


def _card(client, topic_id, title, content="", tags=()):
    r = client.post("/api/cards", json={"title": title, "content": content, "topic_id": topic_id, "tags": list(tags)})
    assert r.status_code == 201, r.text
    return r.json()


def test_topic_crud_and_unique_name(client):
    t = _topic(client, description="APIs con Python", color="green")
    assert t["card_count"] == 0
    assert client.post("/api/topics", json={"name": "backend-python"}).status_code == 409

    r = client.patch(f"/api/topics/{t['id']}", json={"name": "Python"})
    assert r.json()["name"] == "Python"
    assert [x["name"] for x in client.get("/api/topics").json()] == ["Python"]

    assert client.delete(f"/api/topics/{t['id']}").status_code == 204
    assert client.get(f"/api/topics/{t['id']}").status_code == 404


def test_card_tags_are_normalized_and_counted(client):
    t = _topic(client)
    c = _card(client, t["id"], "alembic", "Migraciones", tags=["Base de Datos", "orm", "ORM "])
    assert c["tags"] == ["base-de-datos", "orm"]
    assert c["topic"]["name"] == "Backend-Python"
    assert client.get(f"/api/topics/{t['id']}").json()["card_count"] == 1
    assert client.get("/api/tags").json() == [{"name": "base-de-datos", "count": 1}, {"name": "orm", "count": 1}]

    # Al quitar un tag de su única tarjeta, el tag desaparece.
    client.patch(f"/api/cards/{c['id']}", json={"tags": ["orm"]})
    assert [x["name"] for x in client.get("/api/tags").json()] == ["orm"]


def test_card_requires_existing_topic(client):
    r = client.post("/api/cards", json={"title": "x", "topic_id": 999})
    assert r.status_code == 422


def test_search_prefix_accents_highlight_and_filters(client):
    py = _topic(client, "Backend-Python")
    gh = _topic(client, "GitHub")
    _card(client, py["id"], "alembic", "Herramienta de migraciones para SQLAlchemy", tags=["db"])
    _card(client, py["id"], "sqlalchemy", "ORM de Python. Sesiones y modelos.", tags=["db", "orm"])
    _card(client, gh["id"], "GitHub Actions", "CI/CD: workflows en YAML que corren en cada push", tags=["ci"])

    titles = lambda r: [h["title"] for h in r.json()]  # noqa: E731

    # Prefijo + sin tildes: "migracion" encuentra "migraciones".
    r = client.get("/api/search", params={"q": "migracion"})
    assert titles(r) == ["alembic"]
    assert "\x02migraciones\x03" in r.json()[0]["snippet"]

    # Coincidencia en título rankea primero.
    assert titles(client.get("/api/search", params={"q": "sqlalch"}))[0] == "sqlalchemy"

    # Búsqueda por tag.
    assert titles(client.get("/api/search", params={"q": "ci"})) == ["GitHub Actions"]

    # Filtros: tema y tags (deben cumplirse todos).
    assert sorted(titles(client.get("/api/search", params={"topic_id": py["id"]}))) == ["alembic", "sqlalchemy"]
    assert titles(client.get("/api/search", params=[("tags", "db"), ("tags", "orm")])) == ["sqlalchemy"]
    assert titles(client.get("/api/search", params={"q": "sqlalchemy", "tags": "orm"})) == ["sqlalchemy"]

    # Caracteres raros no rompen la consulta FTS.
    assert client.get("/api/search", params={"q": '"(*'}).status_code == 200


def test_search_index_follows_edits_and_deletes(client):
    t = _topic(client)
    c = _card(client, t["id"], "uvicorn", "Servidor ASGI")
    client.patch(f"/api/cards/{c['id']}", json={"content": "Servidor para FastAPI"})
    assert len(client.get("/api/search", params={"q": "asgi"}).json()) == 0
    assert len(client.get("/api/search", params={"q": "fastapi"}).json()) == 1

    client.delete(f"/api/topics/{t['id']}")
    assert client.get("/api/search", params={"q": "fastapi"}).json() == []
    assert client.get("/api/tags").json() == []
