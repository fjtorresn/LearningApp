"""Búsqueda full-text con SQLite FTS5.

La tabla virtual `cards_fts` (creada en la migración inicial) guarda una copia
del título, contenido y tags de cada tarjeta, con rowid = cards.id.
Cada vez que se crea, edita o borra una tarjeta hay que mantenerla al día.
"""

import re

from sqlalchemy import bindparam, func, select, text
from sqlalchemy.orm import Session, selectinload

from app.models import Card, Tag, card_tags

HL_START, HL_END = "\x02", "\x03"
_TOKEN_RE = re.compile(r"\w+", re.UNICODE)


def index_card(db: Session, card: Card) -> None:
    db.execute(text("DELETE FROM cards_fts WHERE rowid = :id"), {"id": card.id})
    db.execute(
        text("INSERT INTO cards_fts (rowid, title, content, tags) VALUES (:id, :title, :content, :tags)"),
        {"id": card.id, "title": card.title, "content": card.content, "tags": " ".join(card.tag_names)},
    )


def unindex_cards(db: Session, card_ids: list[int]) -> None:
    if card_ids:
        stmt = text("DELETE FROM cards_fts WHERE rowid IN :ids").bindparams(bindparam("ids", expanding=True))
        db.execute(stmt, {"ids": card_ids})


def build_match_query(q: str) -> str | None:
    """'sqlalch migra' -> '"sqlalch"* "migra"*' (todas las palabras, por prefijo)."""
    tokens = _TOKEN_RE.findall(q)
    if not tokens:
        return None
    return " ".join(f'"{t}"*' for t in tokens)


def _plain_snippet(content: str, length: int = 160) -> str:
    flat = " ".join(content.split())
    return flat if len(flat) <= length else flat[:length].rstrip() + "…"


def search_cards(
    db: Session,
    user_id: int,
    q: str = "",
    topic_id: int | None = None,
    tags: list[str] | None = None,
    limit: int = 50,
) -> list[dict]:
    tags = tags or []
    match = build_match_query(q)

    # Subconsulta: tarjetas que tienen TODOS los tags pedidos.
    tag_filter_ids = None
    if tags:
        tag_filter_ids = (
            select(card_tags.c.card_id)
            .join(Tag, Tag.id == card_tags.c.tag_id)
            .where(Tag.user_id == user_id, Tag.name.in_(tags))
            .group_by(card_tags.c.card_id)
            .having(func.count(func.distinct(Tag.name)) == len(set(tags)))
        )

    highlights: dict[int, tuple[str, str]] = {}
    if match:
        sql = """
            SELECT cards_fts.rowid AS id,
                   highlight(cards_fts, 0, :hs, :he) AS title_hl,
                   snippet(cards_fts, 1, :hs, :he, '…', 24) AS snip
            FROM cards_fts
            JOIN cards ON cards.id = cards_fts.rowid
            WHERE cards_fts MATCH :match AND cards.user_id = :user_id
        """
        params: dict = {"hs": HL_START, "he": HL_END, "match": match, "limit": limit, "user_id": user_id}
        if topic_id is not None:
            sql += " AND cards.topic_id = :topic_id"
            params["topic_id"] = topic_id
        # bm25: menor = más relevante. Pesos por columna: título > tags > contenido.
        sql += " ORDER BY bm25(cards_fts, 10.0, 1.0, 5.0) LIMIT :limit"
        rows = db.execute(text(sql), params).all()
        ordered_ids = [r.id for r in rows]
        highlights = {r.id: (r.title_hl, r.snip) for r in rows}

        stmt = select(Card).where(Card.id.in_(ordered_ids))
        if tag_filter_ids is not None:
            stmt = stmt.where(Card.id.in_(tag_filter_ids))
        cards_by_id = {c.id: c for c in db.scalars(stmt.options(selectinload(Card.tags), selectinload(Card.topic)))}
        cards = [cards_by_id[i] for i in ordered_ids if i in cards_by_id]
    else:
        stmt = select(Card).options(selectinload(Card.tags), selectinload(Card.topic)).where(Card.user_id == user_id)
        if topic_id is not None:
            stmt = stmt.where(Card.topic_id == topic_id)
        if tag_filter_ids is not None:
            stmt = stmt.where(Card.id.in_(tag_filter_ids))
        cards = list(db.scalars(stmt.order_by(Card.updated_at.desc()).limit(limit)))

    results = []
    for card in cards:
        title_hl, snip = highlights.get(card.id, (card.title, ""))
        # Si la coincidencia no estaba en el contenido, el snippet no tiene marcas: mostramos el inicio.
        if HL_START not in snip:
            snip = _plain_snippet(card.content)
        results.append(
            {
                "id": card.id,
                "title": card.title,
                "title_highlighted": title_hl,
                "snippet": snip,
                "topic": card.topic,
                "tags": card.tag_names,
                "updated_at": card.updated_at,
            }
        )
    return results
