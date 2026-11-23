from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

from app.api.deps import DbSession
from app.core.security import DUMMY_HASH, create_access_token, verify_password
from app.models import User
from app.models.enums import AuditAction, AuditTargetType
from app.schemas.auth import LoginResponse, SessionUser
from app.services.audit import record_audit

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Giriş yap",
    responses={401: {"description": "Kullanıcı adı ya da parola hatalı"}},
)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession):
    """Form-encoded `username` ve `password` alır, JWT döner.

    Yanlış parola, olmayan ya da pasif kullanıcı aynı 401'i alır. Başarılı girişte
    `last_login_at` güncellenir ve `user.login` denetim kaydı aynı commit'te yazılır.
    """
    user = db.scalar(select(User).where(User.username == form.username))
    password_ok = verify_password(form.password, user.password_hash if user else DUMMY_HASH)
    if user is None or not password_ok or not user.is_active:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Kullanıcı adı ya da parola hatalı",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user.last_login_at = datetime.now(UTC)
    record_audit(
        db, user, AuditAction.user_login, AuditTargetType.user, user.id, label=user.username
    )
    db.commit()
    db.refresh(user)
    return LoginResponse(
        access_token=create_access_token(user), user=SessionUser.model_validate(user)
    )
