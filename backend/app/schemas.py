"""Esquemas Pydantic: validan lo que entra a la API y dan forma a lo que sale."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

TopicColor = Literal["blue", "green", "purple", "orange", "pink", "teal", "red", "gray"]


def normalize_tag(raw: str) -> str:
    """'  Base de Datos ' -> 'base-de-datos'"""
    return "-".join(raw.strip().lower().split())


class TopicBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = ""
    color: TopicColor = "blue"

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El nombre no puede estar vacío")
        return v


class TopicCreate(TopicBase):
    pass


class TopicUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    color: TopicColor | None = None


class TopicBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    color: str


class TopicOut(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    card_count: int = 0
    created_at: datetime


class CardBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = ""
    topic_id: int
    tags: list[str] = []

    @field_validator("title")
    @classmethod
    def strip_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El título no puede estar vacío")
        return v

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, v: list[str]) -> list[str]:
        return sorted({normalize_tag(t) for t in v if t.strip()})


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = None
    topic_id: int | None = None
    tags: list[str] | None = None

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        return sorted({normalize_tag(t) for t in v if t.strip()})


class CardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    topic: TopicBrief
    tags: list[str] = Field(validation_alias="tag_names")
    created_at: datetime
    updated_at: datetime


class TagOut(BaseModel):
    name: str
    count: int


class SearchHit(BaseModel):
    id: int
    title: str
    # Texto con marcadores \x02 (inicio) y \x03 (fin) alrededor de las coincidencias.
    # El frontend los convierte en <mark>; así nunca inyectamos HTML.
    title_highlighted: str
    snippet: str
    topic: TopicBrief
    tags: list[str]
    updated_at: datetime
