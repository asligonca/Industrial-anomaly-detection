from collections.abc import Callable
from typing import Annotated, Any

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.core.security import InvalidTokenError, decode_access_token
from app.db.session import get_db
from app.models import User
from app.models.enums import UserRole
from app.schemas.common import Page

DbSession = Annotated[Session, Depends(get_db)]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class Pagination(BaseModel):
    """Liste uçlarının `?limit=&offset=` parametreleri."""

    limit: int
    offset: int


def get_pagination(
    limit: Annotated[int, Query(ge=1, le=200, description="Sayfa boyutu (en fazla 200)")] = 50,
    offset: Annotated[int, Query(ge=0, description="Atlanacak kayıt sayısı")] = 0,
) -> Pagination:
    """Sayfalama parametrelerini doğrular: varsayılan limit 50, en fazla 200."""
    return Pagination(limit=limit, offset=offset)


PaginationParams = Annotated[Pagination, Depends(get_pagination)]


def paginate(
    db: Session, stmt: Select[Any], pagination: Pagination, schema: type[BaseModel]
) -> Page[Any]:
    """Sorguyu sayfalar ve `{items, total, limit, offset}` zarfını döner."""
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery()))
    rows = db.scalars(stmt.limit(pagination.limit).offset(pagination.offset)).all()
    return Page[schema](
        items=[schema.model_validate(row) for row in rows],
        total=total or 0,
        limit=pagination.limit,
        offset=pagination.offset,
    )


def get_current_user(db: DbSession, token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    """`Authorization: Bearer` token'ından giriş yapmış kullanıcıyı yükler.

    Token geçersiz ya da süresi dolmuşsa, kullanıcı yoksa ya da pasifse 401.
    Yetki kararı token'daki role değil DB'deki role göre verilir.
    """
    unauthorized = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Oturum geçersiz ya da süresi dolmuş",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id = decode_access_token(token)
    except InvalidTokenError:
        raise unauthorized
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise unauthorized
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: UserRole) -> Callable[[User], User]:
    """Kullanıcının rolü verilenlerden biri değilse 403 veren bağımlılık üretir."""

    def checker(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Bu işlem için yetkiniz yok")
        return user

    return checker


AdminUser = Annotated[User, Depends(require_role(UserRole.admin))]
