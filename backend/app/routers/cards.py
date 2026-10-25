from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.auth import get_current_user
from app.db import get_db
from app.models import Card, Tag, User, card_tags, utcnow
from app.routers.topics import get_user_topic
from app.schemas import CardCreate, CardOut, CardUpdate, SearchHit, TagOut
from app.search import index_card, search_cards, unindex_cards
from app.tags import get_or_create_tags, prune_orphan_tags

router = APIRouter(prefix="/api", tags=["cards"])


def _get_card(db: Session, user: User, card_id: int) -> Card:
    card = db.get(Card, card_id, options=[selectinload(Card.tags), selectinload(Card.topic)])
    if card is None or card.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tarjeta no encontrada")
    return card


def _ensure_topic(db: Session, user: User, topic_id: int) -> None:
    try:
        get_user_topic(db, user, topic_id)
    except HTTPException:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "El tema indicado no existe") from None


@router.post("/cards", response_model=CardOut, status_code=status.HTTP_201_CREATED)
def create_card(payload: CardCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _ensure_topic(db, user, payload.topic_id)
    card = Card(title=payload.title, content=payload.content, topic_id=payload.topic_id, user_id=user.id)
    card.tags = get_or_create_tags(db, user, payload.tags)
    db.add(card)
    db.flush()  # asigna card.id para poder indexarla
    index_card(db, card)
    db.commit()
    return _get_card(db, user, card.id)


@router.get("/cards/{card_id}", response_model=CardOut)
def get_card(card_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _get_card(db, user, card_id)


@router.patch("/cards/{card_id}", response_model=CardOut)
def update_card(
    card_id: int, payload: CardUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    card = _get_card(db, user, card_id)
    data = payload.model_dump(exclude_unset=True)
    if data.get("topic_id") is not None:
        _ensure_topic(db, user, data["topic_id"])
        card.topic_id = data["topic_id"]
    if data.get("title") is not None:
        title = data["title"].strip()
        if not title:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "El título no puede estar vacío")
        card.title = title
    if data.get("content") is not None:
        card.content = data["content"]
    if data.get("tags") is not None:
        card.tags = get_or_create_tags(db, user, data["tags"])
    card.updated_at = utcnow()  # explícito: onupdate no se dispara si solo cambian los tags
    db.flush()
    index_card(db, card)
    prune_orphan_tags(db)
    db.commit()
    db.expire_all()
    return _get_card(db, user, card_id)


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(card_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    card = _get_card(db, user, card_id)
    unindex_cards(db, [card.id])
    db.delete(card)
    db.flush()
    prune_orphan_tags(db)
    db.commit()


@router.get("/tags", response_model=list[TagOut])
def list_tags(topic_id: int | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = (
        select(Tag.name, func.count(card_tags.c.card_id))
        .join(card_tags, card_tags.c.tag_id == Tag.id)
        .where(Tag.user_id == user.id)
        .group_by(Tag.id)
        .order_by(Tag.name)
    )
    if topic_id is not None:
        stmt = stmt.join(Card, Card.id == card_tags.c.card_id).where(Card.topic_id == topic_id)
    return [TagOut(name=name, count=count) for name, count in db.execute(stmt).all()]


@router.get("/search", response_model=list[SearchHit])
def search(
    q: str = "",
    topic_id: int | None = None,
    tags: list[str] = Query(default=[]),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Sin `q` devuelve las tarjetas más recientes (respetando los filtros)."""
    return search_cards(db, user_id=user.id, q=q, topic_id=topic_id, tags=tags, limit=limit)
