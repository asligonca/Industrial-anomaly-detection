from typing import Any

from pydantic import BaseModel, ConfigDict, computed_field, model_validator

from app.models import AnomalyEvent
from app.models.enums import EventSeverity, EventStatus, EventType
from app.schemas.common import UtcDateTime


def event_code(event_id: int) -> str:
    """Olayın okunabilir kodu: 14 → `OLY-014`."""
    return f"OLY-{event_id:03d}"


def snapshot_url(event_id: int, snapshot_path: str | None) -> str | None:
    """Görüntü adresi; görüntü yoksa `None`. Sunucudaki dosya yolu yanıtta hiç dönmez."""
    return f"/api/events/{event_id}/snapshot" if snapshot_path else None


class EventCameraRef(BaseModel):
    """Olay yanıtındaki kamera özeti."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    area: str


class EventZoneRef(BaseModel):
    """Olay yanıtındaki bölge özeti."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class UserRef(BaseModel):
    """Başka kayıtların içinde geçen kullanıcı."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str


class AlarmActionRead(BaseModel):
    """Olayın durum geçmişindeki bir adım. Kullanıcı silinmişse `user` null."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    from_status: EventStatus
    to_status: EventStatus
    note: str | None
    user: UserRef | None
    created_at: UtcDateTime


class EventRead(BaseModel):
    """`GET /api/events` liste öğesi. `code` ve `snapshot_url` yanıtta üretilir."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    camera_id: int
    camera: EventCameraRef
    zone_id: int | None
    zone: EventZoneRef | None
    type: EventType
    severity: EventSeverity
    confidence: float
    bbox: list[float]
    snapshot_url: str | None
    track_id: int | None
    model_version: str
    status: EventStatus
    created_at: UtcDateTime

    @model_validator(mode="before")
    @classmethod
    def _from_model(cls, data: Any) -> Any:
        """ORM nesnesinden alanları okur; `snapshot_path`'ten `snapshot_url` üretir."""
        if not isinstance(data, AnomalyEvent):
            return data
        values = {
            name: getattr(data, name) for name in cls.model_fields if name != "snapshot_url"
        }
        values["snapshot_url"] = snapshot_url(data.id, data.snapshot_path)
        return values

    @computed_field
    @property
    def code(self) -> str:
        return event_code(self.id)


class EventDetail(EventRead):
    """`GET /api/events/{id}` yanıtı: liste öğesi + durum geçmişi (eskiden yeniye)."""

    actions: list[AlarmActionRead]


class TypeCount(BaseModel):
    type: EventType
    count: int


class CameraCount(BaseModel):
    camera_id: int
    count: int


class DayCount(BaseModel):
    date: str
    count: int


class HourCount(BaseModel):
    hour: int
    count: int


class EventStats(BaseModel):
    """`GET /api/events/stats` yanıtı. Gün ve saat İstanbul saatine göre.

    `by_type` sayıya göre azalan, `by_camera` kamera id'sine göre, `by_day` tarihe göre
    (`YYYY-MM-DD`, yalnızca olay olan günler). `by_hour` her zaman 24 kayıt (0–23).
    """

    by_type: list[TypeCount]
    by_camera: list[CameraCount]
    by_day: list[DayCount]
    by_hour: list[HourCount]
