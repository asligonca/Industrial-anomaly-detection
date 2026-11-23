from typing import Annotated
from urllib.parse import urlsplit, urlunsplit

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

from app.schemas.common import UtcDateTime

CameraName = Annotated[str, Field(min_length=1, max_length=100)]
CameraArea = Annotated[str, Field(min_length=1, max_length=50, description="Kamera grubu (Üretim, Depo...)")]
CameraLocation = Annotated[str, Field(max_length=255, description="Kameranın tam yeri")]
StreamUrl = Annotated[str, Field(min_length=1, max_length=500, description="RTSP adresi ya da video dosyası yolu")]

MASK = "***"
"""Yanıtta parolanın yerine yazılan işaret."""


def mask_stream_url(url: str | None) -> str | None:
    """Adresteki parolayı `***` ile değiştirir: `rtsp://user:pass@host` → `rtsp://user:***@host`."""
    if not url:
        return url
    parts = urlsplit(url)
    if parts.password is None:
        return url
    userinfo, _, hostinfo = parts.netloc.rpartition("@")
    username = userinfo.split(":", 1)[0]
    return urlunsplit(parts._replace(netloc=f"{username}:{MASK}@{hostinfo}"))


def camera_code(camera_id: int) -> str:
    """Kameranın okunabilir kodu: 3 → `KAM-03`."""
    return f"KAM-{camera_id:02d}"


class CameraCreate(BaseModel):
    """`POST /api/cameras` gövdesi."""

    name: CameraName
    area: CameraArea
    stream_url: StreamUrl
    location: CameraLocation | None = None
    is_active: bool = True


class CameraUpdate(BaseModel):
    """`PATCH /api/cameras/{id}` gövdesi. Gönderilmeyen alan değişmez.

    `name`, `area` ve `is_active` için `null` kabul edilmez. `stream_url` maskeli hâliyle
    geri gelirse eski adres korunur.
    """

    name: CameraName = Field(default=None)
    area: CameraArea = Field(default=None)
    stream_url: StreamUrl | None = None
    location: CameraLocation | None = None
    is_active: bool = Field(default=None)


class CameraRead(BaseModel):
    """Kamera yanıtı. `code` id'den üretilir, `stream_url` içindeki parola maskelenir."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    area: str
    location: str | None
    stream_url: str | None
    is_active: bool
    created_at: UtcDateTime

    @field_validator("stream_url")
    @classmethod
    def _mask(cls, value: str | None) -> str | None:
        return mask_stream_url(value)

    @computed_field
    @property
    def code(self) -> str:
        return camera_code(self.id)
