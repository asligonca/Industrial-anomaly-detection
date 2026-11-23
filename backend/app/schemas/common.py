from datetime import UTC, datetime
from typing import Annotated, Generic, TypeVar

from pydantic import AfterValidator, BaseModel, PlainSerializer

T = TypeVar("T")


def _as_utc(value: datetime) -> datetime:
    """SQLite saat dilimsiz tarih döndürür; bunları UTC kabul eder, diğerlerini UTC'ye çevirir."""
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _to_iso_z(value: datetime) -> str:
    """Tarihi `2026-11-05T10:30:00Z` biçiminde yazar."""
    return value.isoformat().replace("+00:00", "Z")


UtcDateTime = Annotated[
    datetime,
    AfterValidator(_as_utc),
    PlainSerializer(_to_iso_z, return_type=str, when_used="json"),
]
"""Yanıtlarda her zaman UTC ve `Z` ile biten ISO 8601 tarih."""


class Page(BaseModel, Generic[T]):
    """Bütün liste uçlarının ortak zarfı. `total` filtrelenmiş toplam kayıt sayısıdır."""

    items: list[T]
    total: int
    limit: int
    offset: int
