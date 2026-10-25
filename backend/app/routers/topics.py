from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import Card, Topic, User
from app.schemas import TopicCreate, TopicOut, TopicUpdate
from app.search import unindex_cards
from app.tags import prune_orphan_tags

router = APIRouter(prefix="/api/topics", tags=["topics"])


def _topic_out(topic: Topic, card_count: int) -> TopicOut:
    out = TopicOut.model_validate(topic)
    out.card_count = card_count
    return out


def get_user_topic(db: Session, user: User, topic_id: int) -> Topic:
    topic = db.get(Topic, topic_id)
    # Un tema de otro usuario responde 404, igual que uno inexistente.
    if topic is None or topic.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tema no encontrado")
    return topic


def _ensure_unique_name(db: Session, user: User, name: str, exclude_id: int | None = None) -> None:
    stmt = select(Topic.id).where(Topic.user_id == user.id, func.lower(Topic.name) == name.lower())
    if exclude_id is not None:
        stmt = stmt.where(Topic.id != exclude_id)
    if db.scalar(stmt) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Ya existe un tema llamado '{name}'")


def _card_count(db: Session, topic_id: int) -> int:
    return db.scalar(select(func.count(Card.id)).where(Card.topic_id == topic_id)) or 0


@router.get("", response_model=list[TopicOut])
def list_topics(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = (
        select(Topic, func.count(Card.id))
        .outerjoin(Card, Card.topic_id == Topic.id)
        .where(Topic.user_id == user.id)
        .group_by(Topic.id)
        .order_by(func.lower(Topic.name))
    )
    return [_topic_out(topic, count) for topic, count in db.execute(stmt).all()]


@router.post("", response_model=TopicOut, status_code=status.HTTP_201_CREATED)
def create_topic(payload: TopicCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _ensure_unique_name(db, user, payload.name)
    topic = Topic(**payload.model_dump(), user_id=user.id)
    db.add(topic)
    db.commit()
    return _topic_out(topic, 0)


@router.get("/{topic_id}", response_model=TopicOut)
def get_topic(topic_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    topic = get_user_topic(db, user, topic_id)
    return _topic_out(topic, _card_count(db, topic_id))


@router.patch("/{topic_id}", response_model=TopicOut)
def update_topic(
    topic_id: int, payload: TopicUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    topic = get_user_topic(db, user, topic_id)
    data = payload.model_dump(exclude_unset=True)
    if "name" in data:
        data["name"] = data["name"].strip()
        _ensure_unique_name(db, user, data["name"], exclude_id=topic_id)
    for key, value in data.items():
        setattr(topic, key, value)
    db.commit()
    return _topic_out(topic, _card_count(db, topic_id))


@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(topic_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    topic = get_user_topic(db, user, topic_id)
    card_ids = list(db.scalars(select(Card.id).where(Card.topic_id == topic_id)))
    unindex_cards(db, card_ids)
    db.delete(topic)
    db.flush()
    prune_orphan_tags(db)
    db.commit()
