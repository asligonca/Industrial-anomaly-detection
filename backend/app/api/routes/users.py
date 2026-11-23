from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import AdminUser, DbSession, PaginationParams, paginate
from app.api.errors import FORBIDDEN_RESPONSE, UNAUTHORIZED_RESPONSE
from app.core.security import hash_password
from app.models import User
from app.schemas.common import Page
from app.schemas.user import UserCreate, UserRead

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={**UNAUTHORIZED_RESPONSE, **FORBIDDEN_RESPONSE},
)

USERNAME_TAKEN = "Bu kullanıcı adı zaten kullanılıyor"


@router.get("", response_model=Page[UserRead], summary="Kullanıcıları listele")
def list_users(db: DbSession, pagination: PaginationParams, _admin: AdminUser):
    """Kullanıcıları id sırasıyla döner (yalnızca admin). `password_hash` yanıtta yoktur."""
    stmt = select(User).order_by(User.id)
    return paginate(db, stmt, pagination, UserRead)


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Kullanıcı ekle",
    responses={409: {"description": "Kullanıcı adı zaten kullanılıyor"}},
)
def create_user(payload: UserCreate, db: DbSession, _admin: AdminUser):
    """Yeni kullanıcı ekler (yalnızca admin); parola bcrypt ile hash'lenir. Aynı ad varsa 409."""
    if db.scalar(select(User.id).where(User.username == payload.username)) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, USERNAME_TAKEN)
    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, USERNAME_TAKEN)
    db.refresh(user)
    return user
