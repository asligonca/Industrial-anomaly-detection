from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.models.enums import UserRole


class SessionUser(BaseModel):
    """Giriş yanıtındaki kullanıcı: yalnızca kimlik ve rol."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: UserRole


class LoginResponse(BaseModel):
    """`POST /api/auth/login` yanıtı."""

    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: SessionUser
