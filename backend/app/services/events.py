import re
from collections import Counter
from datetime import UTC, datetime
from typing import Annotated, Any, Literal
from zoneinfo import ZoneInfo

from fastapi import HTTPException, Query, status
from pydantic import AwareDatetime, BaseModel
from sqlalchemy import ColumnElement, Select, case, false, or_, select
from sqlalchemy.orm import Session

from app.models import AnomalyEvent, Camera
from app.models.enums import EventSeverity, EventStatus, EventType
from app.schemas.event import CameraCount, DayCount, EventStats, HourCount, TypeCount

FACILITY_TZ = ZoneInfo("Europe/Istanbul")
HOURS_PER_DAY = 24

EventSort = Literal[
    "created_at", "-created_at", "severity", "-severity", "confidence", "-confidence"
]

SEVERITY_RANK = {
    EventSeverity.info: 0,
    EventSeverity.medium: 1,
    EventSeverity.high: 2,
    EventSeverity.critical: 3,
}

EVENT_CODE_RE = re.compile(r"(?:oly-?)?0*(\d+)", re.IGNORECASE)
CAMERA_CODE_RE = re.compile(r"kam-?0*(\d+)", re.IGNORECASE)


class EventFilters(BaseModel):
    """Olay listesi ve istatistiğin ortak filtreleri. Boş liste = o alanda filtre yok."""

    camera_id: list[int] = []
    zone_id: list[int] = []
    area: str | None = None
    type: list[str] = []
    status: list[EventStatus] = []
    severity: list[EventSeverity] = []
    q: str | None = None
    from_: datetime | None = None
    to: datetime | None = None


def get_event_filters(
    camera_id: Annotated[list[int] | None, Query(description="Tekrar eden parametreyle çoklu")] = None,
    zone_id: Annotated[list[int] | None, Query(description="Tekrar eden parametreyle çoklu")] = None,
    area: Annotated[str | None, Query(description="Kamera grubu (`cameras.area`)")] = None,
    type_: Annotated[
        list[str] | None,
        Query(
            alias="type",
            description=(
                "Olay türü, tekrar eden parametreyle çoklu. Backend'in bilmediği türler 422 "
                "vermez, hiçbir olayla eşleşmez."
            ),
        ),
    ] = None,
    status_: Annotated[list[EventStatus] | None, Query(alias="status")] = None,
    severity: Annotated[list[EventSeverity] | None, Query()] = None,
    q: Annotated[
        str | None,
        Query(description="Olay kodu (`OLY-014` ya da `14`), kamera kodu (`KAM-03`) ya da kamera adı"),
    ] = None,
    from_: Annotated[
        AwareDatetime | None, Query(alias="from", description="Saat dilimli ISO tarih-saat")
    ] = None,
    to: Annotated[
        AwareDatetime | None, Query(description="Saat dilimli ISO tarih-saat, dahil")
    ] = None,
) -> EventFilters:
    """Sorgu parametrelerini okur.

    Tür filtresi bilerek serbest metindir: ön yüz modelin henüz üretmediği türleri de
    (ör. "Diğer" kategorisindeki `unregistered_visitor`) gönderebilir. Bunları 422 ile
    reddetmek ekranı bozar; DB'de böyle bir tür olamayacağı için sonuç doğru olarak boş çıkar.
    `from`/`to` UTC'ye çevrilir; `from` `to`'dan sonraysa 422.
    """
    from_utc = from_.astimezone(UTC) if from_ else None
    to_utc = to.astimezone(UTC) if to else None
    if from_utc and to_utc and from_utc > to_utc:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            [
                {
                    "type": "invalid_range",
                    "loc": ["query", "from"],
                    "msg": "`from`, `to`'dan sonra olamaz",
                    "input": from_.isoformat(),
                }
            ],
        )
    return EventFilters(
        camera_id=camera_id or [],
        zone_id=zone_id or [],
        area=area,
        type=type_ or [],
        status=status_ or [],
        severity=severity or [],
        q=q,
        from_=from_utc,
        to=to_utc,
    )


def _fold(text: str) -> str:
    """Türkçe kurallarıyla küçük harfe çevirir (I → ı, İ → i)."""
    return text.replace("I", "ı").replace("İ", "i").lower()


def _query_condition(db: Session, raw: str) -> ColumnElement[bool] | None:
    """`q` aramasını koşula çevirir: olay kodu/id, kamera kodu, kamera adı (Türkçe, harfe duyarsız).

    Kamera adı eşleşmesi Python'da yapılır; SQLite'ın `lower()`'ı Ü/İ gibi harfleri çevirmez.
    """
    query = raw.strip()
    if not query:
        return None
    conditions: list[ColumnElement[bool]] = []
    if match := EVENT_CODE_RE.fullmatch(query):
        conditions.append(AnomalyEvent.id == int(match.group(1)))
    camera_ids: set[int] = set()
    if match := CAMERA_CODE_RE.fullmatch(query):
        camera_ids.add(int(match.group(1)))
    needle = _fold(query)
    camera_ids.update(
        camera_id
        for camera_id, name in db.execute(select(Camera.id, Camera.name))
        if needle in _fold(name)
    )
    if camera_ids:
        conditions.append(AnomalyEvent.camera_id.in_(camera_ids))
    return or_(*conditions) if conditions else false()


def apply_filters(stmt: Select[Any], filters: EventFilters, db: Session) -> Select[Any]:
    """Filtreleri olay sorgusuna uygular. Liste ve istatistik aynı kuralı kullanır."""
    if filters.camera_id:
        stmt = stmt.where(AnomalyEvent.camera_id.in_(filters.camera_id))
    if filters.zone_id:
        stmt = stmt.where(AnomalyEvent.zone_id.in_(filters.zone_id))
    if filters.area is not None:
        stmt = stmt.where(
            AnomalyEvent.camera_id.in_(select(Camera.id).where(Camera.area == filters.area))
        )
    if filters.type:
        known = [t for t in filters.type if t in EventType.__members__]
        stmt = stmt.where(AnomalyEvent.type.in_(known) if known else false())
    if filters.status:
        stmt = stmt.where(AnomalyEvent.status.in_(filters.status))
    if filters.severity:
        stmt = stmt.where(AnomalyEvent.severity.in_(filters.severity))
    if filters.from_ is not None:
        stmt = stmt.where(AnomalyEvent.created_at >= filters.from_)
    if filters.to is not None:
        stmt = stmt.where(AnomalyEvent.created_at <= filters.to)
    if filters.q is not None:
        condition = _query_condition(db, filters.q)
        if condition is not None:
            stmt = stmt.where(condition)
    return stmt


def apply_sort(stmt: Select[Any], sort: EventSort) -> Select[Any]:
    """`?sort=` uygular; başında `-` azalan. Eşitlikte en yeni olay önde."""
    descending = sort.startswith("-")
    field = sort.lstrip("-")
    if field == "severity":
        key = case(
            {level.value: rank for level, rank in SEVERITY_RANK.items()},
            value=AnomalyEvent.severity,
        )
    elif field == "confidence":
        key = AnomalyEvent.confidence
    else:
        key = AnomalyEvent.created_at
    return stmt.order_by(
        key.desc() if descending else key.asc(),
        AnomalyEvent.created_at.desc(),
        AnomalyEvent.id.desc(),
    )


def _local(value: datetime) -> datetime:
    """DB'den gelen tarihi (SQLite'ta saat dilimsiz, UTC) tesis saatine çevirir."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(FACILITY_TZ)


def build_stats(db: Session, filters: EventFilters) -> EventStats:
    """Filtrelenmiş olaylardan istatistik üretir; gün ve saat İstanbul saatine göre.

    Gruplama Python'da yapılır: SQLite'a özgü tarih fonksiyonlarına bağlı kalmaz.
    Yalnızca üç sütun çekilir; demo ölçeğinde yeterli, veri büyürse SQL'e taşınır.
    """
    stmt = apply_filters(
        select(AnomalyEvent.type, AnomalyEvent.camera_id, AnomalyEvent.created_at), filters, db
    )
    by_type: Counter[EventType] = Counter()
    by_camera: Counter[int] = Counter()
    by_day: Counter[str] = Counter()
    by_hour = [0] * HOURS_PER_DAY
    for event_type, camera_id, created_at in db.execute(stmt):
        local = _local(created_at)
        by_type[event_type] += 1
        by_camera[camera_id] += 1
        by_day[local.date().isoformat()] += 1
        by_hour[local.hour] += 1
    return EventStats(
        by_type=[
            TypeCount(type=t, count=c)
            for t, c in sorted(by_type.items(), key=lambda item: (-item[1], item[0]))
        ],
        by_camera=[CameraCount(camera_id=i, count=c) for i, c in sorted(by_camera.items())],
        by_day=[DayCount(date=d, count=c) for d, c in sorted(by_day.items())],
        by_hour=[HourCount(hour=h, count=c) for h, c in enumerate(by_hour)],
    )
