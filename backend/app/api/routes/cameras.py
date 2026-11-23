from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import AdminUser, CurrentUser, DbSession, PaginationParams, paginate
from app.api.errors import FORBIDDEN_RESPONSE, UNAUTHORIZED_RESPONSE, body_field_error
from app.models import Camera
from app.schemas.camera import (
    MASK,
    CameraCreate,
    CameraRead,
    CameraUpdate,
    mask_stream_url,
)
from app.schemas.common import Page

router = APIRouter(prefix="/cameras", tags=["cameras"], responses=UNAUTHORIZED_RESPONSE)


def _masked_url_error(value: str) -> HTTPException:
    return body_field_error(
        "stream_url",
        "Adres maskeli parola (***) içeriyor; gerçek parolayı girin",
        "masked_stream_url",
        value,
    )


@router.get("", response_model=Page[CameraRead], summary="Kameraları listele")
def list_cameras(db: DbSession, pagination: PaginationParams, _user: CurrentUser):
    """Aktif ve pasif bütün kameraları id sırasıyla döner. Giriş yapmış herkes görebilir."""
    stmt = select(Camera).order_by(Camera.id)
    return paginate(db, stmt, pagination, CameraRead)


@router.post(
    "",
    response_model=CameraRead,
    status_code=status.HTTP_201_CREATED,
    summary="Kamera ekle",
    responses=FORBIDDEN_RESPONSE,
)
def create_camera(payload: CameraCreate, db: DbSession, _admin: AdminUser):
    """Yeni kamera ekler (yalnızca admin). Yanıtta `code` üretilir ve `stream_url` maskelenir.

    `stream_url` içinde `***` varsa 422: maskeli bir adres kopyalanıp kaydedilemez.
    """
    if MASK in payload.stream_url:
        raise _masked_url_error(payload.stream_url)
    camera = Camera(**payload.model_dump())
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera


@router.patch(
    "/{camera_id}",
    response_model=CameraRead,
    summary="Kamerayı güncelle",
    responses={**FORBIDDEN_RESPONSE, 404: {"description": "Kamera bulunamadı"}},
)
def update_camera(camera_id: int, payload: CameraUpdate, db: DbSession, _admin: AdminUser):
    """Kamerayı kısmen günceller (yalnızca admin); aktif/pasif için `{is_active}` gönderilir.

    `stream_url` gönderilmezse ya da yanıttaki maskeli hâliyle aynı gelirse eski adres korunur.
    Başka bir değer `***` içeriyorsa 422.
    """
    camera = db.get(Camera, camera_id)
    if camera is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Kamera bulunamadı")
    changes = payload.model_dump(exclude_unset=True)
    new_url = changes.get("stream_url")
    if new_url is not None:
        if new_url == mask_stream_url(camera.stream_url):
            del changes["stream_url"]
        elif MASK in new_url:
            raise _masked_url_error(new_url)
    for field, value in changes.items():
        setattr(camera, field, value)
    db.commit()
    db.refresh(camera)
    return camera
