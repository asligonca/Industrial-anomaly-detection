from typing import Annotated, Any

from fastapi import Depends, Query
from pydantic import BaseModel
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import Page

DbSession = Annotated[Session, Depends(get_db)]


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
