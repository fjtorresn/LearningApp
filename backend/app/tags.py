from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import Tag, card_tags


def get_or_create_tags(db: Session, names: list[str]) -> list[Tag]:
    existing = {t.name: t for t in db.scalars(select(Tag).where(Tag.name.in_(names)))}
    tags = []
    for name in names:
        tag = existing.get(name)
        if tag is None:
            tag = Tag(name=name)
            db.add(tag)
        tags.append(tag)
    return tags


def prune_orphan_tags(db: Session) -> None:
    """Borra los tags que ya no usa ninguna tarjeta."""
    db.execute(delete(Tag).where(Tag.id.not_in(select(card_tags.c.tag_id))))
