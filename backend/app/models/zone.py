from typing import TYPE_CHECKING

from sqlalchemy import JSON, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ZoneRuleType

if TYPE_CHECKING:
    from app.models.camera import Camera


class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[int] = mapped_column(primary_key=True)
    camera_id: Mapped[int] = mapped_column(ForeignKey("cameras.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    polygon: Mapped[list[list[float]]] = mapped_column(JSON)
    rule_type: Mapped[ZoneRuleType] = mapped_column(
        Enum(ZoneRuleType, native_enum=False, length=50)
    )
    is_active: Mapped[bool] = mapped_column(default=True)

    camera: Mapped["Camera"] = relationship(back_populates="zones")
