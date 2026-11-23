from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import CurrentUser, DbSession, PaginationParams, paginate
from app.api.errors import UNAUTHORIZED_RESPONSE
from app.models import AlarmAction, AnomalyEvent
from app.models.enums import EVENT_STATUS_TRANSITIONS, AuditAction, AuditTargetType
from app.schemas.common import Page
from app.schemas.event import (
    EventDetail,
    EventRead,
    EventStats,
    EventStatusUpdate,
    event_code,
)
from app.services.audit import record_audit
from app.services.events import (
    EventFilters,
    EventSort,
    apply_filters,
    apply_sort,
    build_stats,
    get_event_filters,
)

router = APIRouter(prefix="/events", tags=["events"], responses=UNAUTHORIZED_RESPONSE)

Filters = Annotated[EventFilters, Depends(get_event_filters)]


@router.get("/stats", response_model=EventStats, summary="Olay istatistikleri")
def event_stats(db: DbSession, filters: Filters, _user: CurrentUser):
    """Türe, kameraya, güne ve saate göre olay sayıları. Liste ile aynı filtreleri alır.

    Gün ve saat İstanbul saatine göre; `by_hour` her zaman 24 kayıt (olay olmayan saat 0).
    """
    return build_stats(db, filters)


@router.get("", response_model=Page[EventRead], summary="Olayları listele")
def list_events(
    db: DbSession,
    pagination: PaginationParams,
    filters: Filters,
    _user: CurrentUser,
    sort: Annotated[
        EventSort,
        Query(description="Alan adı, başında `-` azalan. `severity`: critical > high > medium > info"),
    ] = "-created_at",
):
    """Filtrelenmiş ve sıralanmış olaylar. `total` filtrelenmiş toplam; kamera ve bölge özeti dahil."""
    stmt = select(AnomalyEvent).options(
        selectinload(AnomalyEvent.camera), selectinload(AnomalyEvent.zone)
    )
    stmt = apply_sort(apply_filters(stmt, filters, db), sort)
    return paginate(db, stmt, pagination, EventRead)


def _load_event_detail(db: Session, event_id: int) -> AnomalyEvent:
    """Olayı kamera, bölge ve durum geçmişiyle birlikte yükler; yoksa 404."""
    event = db.scalar(
        select(AnomalyEvent)
        .where(AnomalyEvent.id == event_id)
        .options(
            selectinload(AnomalyEvent.camera),
            selectinload(AnomalyEvent.zone),
            selectinload(AnomalyEvent.actions).selectinload(AlarmAction.user),
        )
    )
    if event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Olay bulunamadı")
    return event


@router.get(
    "/{event_id}",
    response_model=EventDetail,
    summary="Olay detayı",
    responses={404: {"description": "Olay bulunamadı"}},
)
def get_event(event_id: int, db: DbSession, _user: CurrentUser):
    """Liste öğesi + durum geçmişi (`actions`, eskiden yeniye)."""
    return EventDetail.model_validate(_load_event_detail(db, event_id))


@router.patch(
    "/{event_id}/status",
    response_model=EventDetail,
    summary="Olay durumunu değiştir",
    responses={
        404: {"description": "Olay bulunamadı"},
        409: {"description": "Bu durum geçişine izin verilmiyor (aynı duruma geçiş dahil)"},
    },
)
def change_event_status(
    event_id: int, payload: EventStatusUpdate, db: DbSession, user: CurrentUser
):
    """Olayın durumunu değiştirir (admin ve operatör); yanıt güncel olay detayıdır.

    İzinli geçişler: new → reviewing | confirmed | false_alarm; reviewing → new | confirmed |
    false_alarm; confirmed / false_alarm → reviewing. Diğerleri 409. Not kırpılır, boşsa `null`.
    Durum, `alarm_actions` kaydı ve `event.status_changed` denetim kaydı tek commit'te yazılır.
    """
    event = _load_event_detail(db, event_id)
    from_status = event.status
    to_status = payload.status
    if to_status not in EVENT_STATUS_TRANSITIONS[from_status]:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Olay durumu {from_status.value} → {to_status.value} olarak değiştirilemez",
        )
    event.status = to_status
    db.add(
        AlarmAction(
            event_id=event.id,
            user_id=user.id,
            from_status=from_status,
            to_status=to_status,
            note=payload.note,
        )
    )
    record_audit(
        db,
        user,
        AuditAction.event_status_changed,
        AuditTargetType.event,
        event.id,
        label=event_code(event.id),
        details={"from": from_status.value, "to": to_status.value},
    )
    db.commit()
    return EventDetail.model_validate(_load_event_detail(db, event_id))
