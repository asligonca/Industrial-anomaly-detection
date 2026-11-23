from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher

from app.core.config import settings
from app.models import User

password_hash = PasswordHash((BcryptHasher(),))

DUMMY_HASH = password_hash.hash("zamanlama-icin-sahte-parola")
"""Kullanıcı bulunamadığında da doğrulama yapılsın diye; yanıt süresi kullanıcının varlığını ele vermez."""


class InvalidTokenError(Exception):
    """Token çözülemedi, imzası tutmuyor, süresi dolmuş ya da içeriği eksik."""


def hash_password(password: str) -> str:
    """Parolayı bcrypt ile hash'ler. DB'ye yalnızca bu değer yazılır."""
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    """Düz parolanın hash ile eşleşip eşleşmediğini döner."""
    return password_hash.verify(password, hashed)


def create_access_token(user: User, expires_delta: timedelta | None = None) -> str:
    """Kullanıcı için JWT üretir: `sub` (id, string), `role`, `iat`, `exp`."""
    now = datetime.now(UTC)
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": str(user.id),
        "role": user.role.value,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int:
    """Token'ı doğrular ve kullanıcı id'sini döner. Geçersizse `InvalidTokenError`."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["sub", "exp"]},
        )
        return int(payload["sub"])
    except (jwt.PyJWTError, ValueError, TypeError) as exc:
        raise InvalidTokenError from exc
