from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import AdminUser, DbSession, PaginationParams, paginate
from app.api.errors import FORBIDDEN_RESPONSE, UNAUTHORIZED_RESPONSE
from app.models import AuditLog
from app.schemas.audit import AuditLogRead
from app.schemas.common import Page

router = APIRouter(
    prefix="/audit-logs",
    tags=["audit-logs"],
    responses={**UNAUTHORIZED_RESPONSE, **FORBIDDEN_RESPONSE},
)


@router.get("", response_model=Page[AuditLogRead], summary="Denetim kayıtlarını listele")
def list_audit_logs(db: DbSession, pagination: PaginationParams, _admin: AdminUser):
    """Denetim kayıtları, en yeni üstte (yalnızca admin).

    `action` metin değil koddur (`user.login`, `event.status_changed`, `camera.updated` …);
    `details.label` kayıt anındaki görüntü adı, durum değişikliğinde ayrıca `from`/`to`.
    """
    stmt = (
        select(AuditLog)
        .options(selectinload(AuditLog.user))
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
    )
    return paginate(db, stmt, pagination, AuditLogRead)
