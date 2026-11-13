from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import EventSeverity, EventStatus, EventType

if TYPE_CHECKING:
    from app.models.alarm_action import AlarmAction
    from app.models.camera import Camera
    from app.models.zone import Zone


class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"
    __table_args__ = (
        Index("ix_anomaly_events_camera_id_created_at", "camera_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    camera_id: Mapped[int] = mapped_column(ForeignKey("cameras.id"))
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id"), index=True)
    type: Mapped[EventType] = mapped_column(Enum(EventType, native_enum=False, length=30))
    severity: Mapped[EventSeverity] = mapped_column(
        Enum(EventSeverity, native_enum=False, length=20)
    )
    confidence: Mapped[float] = mapped_column(Float)
    bbox: Mapped[list[float]] = mapped_column(JSON)
    snapshot_path: Mapped[str | None] = mapped_column(String(500))
    track_id: Mapped[int | None]
    model_version: Mapped[str] = mapped_column(String(50))
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, native_enum=False, length=20), default=EventStatus.new, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    camera: Mapped["Camera"] = relationship()
    zone: Mapped["Zone | None"] = relationship()
    actions: Mapped[list["AlarmAction"]] = relationship(
        back_populates="event", order_by="AlarmAction.created_at"
    )
