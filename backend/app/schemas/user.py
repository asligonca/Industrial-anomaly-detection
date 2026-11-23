from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

from app.models.enums import UserRole
from app.schemas.common import UtcDateTime


def _fits_bcrypt(value: str) -> str:
    """bcrypt en fazla 72 bayt işler; Türkçe karakterler birden fazla bayt tutabilir."""
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Parola en fazla 72 bayt olabilir")
    return value


Username = Annotated[str, Field(min_length=1, max_length=50)]
Password = Annotated[str, Field(min_length=8), AfterValidator(_fits_bcrypt)]


class UserCreate(BaseModel):
    """`POST /api/users` gövdesi. Parola en az 8 karakter."""

    username: Username
    password: Password
    role: UserRole = UserRole.operator


class UserUpdate(BaseModel):
    """Kullanıcı kısmi güncelleme gövdesi. Gönderilmeyen alan değişmez; `null` kabul edilmez."""

    username: Username = Field(default=None)
    password: Password = Field(default=None)
    role: UserRole = Field(default=None)


class UserRead(BaseModel):
    """Kullanıcı yanıtı. `password_hash` hiçbir yanıtta dönmez."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: UserRole
    is_active: bool
    created_at: UtcDateTime
    last_login_at: UtcDateTime | None
