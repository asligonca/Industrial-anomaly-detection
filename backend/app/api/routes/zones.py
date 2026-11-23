from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.api.deps import DbSession, PaginationParams, paginate
from app.models import Camera, Zone
from app.schemas.common import Page
from app.schemas.zone import ZoneCreate, ZoneRead

router = APIRouter(prefix="/zones", tags=["zones"])


@router.get("", response_model=Page[ZoneRead], summary="Aktif bölgeleri listele")
def list_zones(db: DbSession, pagination: PaginationParams):
    """Yalnızca aktif bölgeleri id sırasıyla döner; silinmiş (pasif) bölgeler listede yoktur."""
    stmt = select(Zone).where(Zone.is_active.is_(True)).order_by(Zone.id)
    return paginate(db, stmt, pagination, ZoneRead)


@router.post(
    "", response_model=ZoneRead, status_code=status.HTTP_201_CREATED, summary="Bölge ekle"
)
def create_zone(payload: ZoneCreate, db: DbSession):
    """Yeni bölge ekler. Polygon zorunlu, noktalar 0–1 normalize. Kamera yoksa 422."""
    if db.get(Camera, payload.camera_id) is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            [
                {
                    "type": "camera_not_found",
                    "loc": ["body", "camera_id"],
                    "msg": "Kamera bulunamadı",
                    "input": payload.camera_id,
                }
            ],
        )
    zone = Zone(**payload.model_dump())
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.delete(
    "/{zone_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Bölgeyi sil (soft delete)",
    responses={404: {"description": "Bölge bulunamadı ya da zaten silinmiş"}},
)
def delete_zone(zone_id: int, db: DbSession):
    """Bölgeyi pasif yapar (`is_active=False`); eski olaylar bölgesini kaybetmez.

    Bölge yoksa ya da zaten silinmişse 404.
    """
    zone = db.get(Zone, zone_id)
    if zone is None or not zone.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Bölge bulunamadı")
    zone.is_active = False
    db.commit()
