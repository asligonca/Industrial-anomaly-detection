from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import EventStatus

if TYPE_CHECKING:
    from app.models.anomaly_event import AnomalyEvent
    from app.models.user import User


class AlarmAction(Base):
    """Bir olayın durum geçmişindeki tek bir adım (kim, neyi neye çevirdi)."""

    __tablename__ = "alarm_actions"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("anomaly_events.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    from_status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, native_enum=False, length=20)
    )
    to_status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, native_enum=False, length=20)
    )
    note: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    event: Mapped["AnomalyEvent"] = relationship(back_populates="actions")
    user: Mapped["User"] = relationship()
