from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DbSession, PaginationParams, paginate
from app.models import Camera
from app.schemas.camera import CameraCreate, CameraRead, CameraUpdate, mask_stream_url
from app.schemas.common import Page

router = APIRouter(prefix="/cameras", tags=["cameras"])


@router.get("", response_model=Page[CameraRead], summary="Kameraları listele")
def list_cameras(db: DbSession, pagination: PaginationParams):
    """Aktif ve pasif bütün kameraları id sırasıyla döner."""
    stmt = select(Camera).order_by(Camera.id)
    return paginate(db, stmt, pagination, CameraRead)


@router.post(
    "", response_model=CameraRead, status_code=status.HTTP_201_CREATED, summary="Kamera ekle"
)
def create_camera(payload: CameraCreate, db: DbSession):
    """Yeni kamera ekler. Yanıtta `code` üretilir ve `stream_url` maskelenir."""
    camera = Camera(**payload.model_dump())
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera


@router.patch(
    "/{camera_id}",
    response_model=CameraRead,
    summary="Kamerayı güncelle",
    responses={404: {"description": "Kamera bulunamadı"}},
)
def update_camera(camera_id: int, payload: CameraUpdate, db: DbSession):
    """Kamerayı kısmen günceller; aktif/pasif için `{is_active}` gönderilir.

    `stream_url` gönderilmezse ya da yanıttaki maskeli hâliyle aynı gelirse eski adres korunur.
    """
    camera = db.get(Camera, camera_id)
    if camera is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Kamera bulunamadı")
    changes = payload.model_dump(exclude_unset=True)
    if "stream_url" in changes and changes["stream_url"] == mask_stream_url(camera.stream_url):
        del changes["stream_url"]
    for field, value in changes.items():
        setattr(camera, field, value)
    db.commit()
    db.refresh(camera)
    return camera
