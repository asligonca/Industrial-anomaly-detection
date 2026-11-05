from datetime import datetime          # 1. standart kütüphane import'ları alfabetik: datetime, typing
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
                                       # 2. if bloğundan önce bir boş satır
if TYPE_CHECKING:
    from app.models.zone import Zone

                                       # 3. sınıftan önce iki boş satır
class Camera(Base):
    __tablename__ = "cameras"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    area: Mapped[str] = mapped_column(String(50))
    location: Mapped[str | None] = mapped_column(String(255))
    stream_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    zones: Mapped[list["Zone"]] = relationship(back_populates="camera")


