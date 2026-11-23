from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditLog, User
from app.models.enums import AuditAction, AuditTargetType


def record_audit(
    db: Session,
    user: User | None,
    action: AuditAction,
    target_type: AuditTargetType | None,
    target_id: int | None,
    label: str | None = None,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    """Denetim kaydını oturuma ekler, commit etmez.

    Kayıt, işlemin kendi `db.commit()`'iyle birlikte yazılır; işlem geri alınırsa kayıt da
    yazılmaz. `label` hedefin o anki görüntü adıdır (`KAM-07`, `OLY-014`, bölge adı):
    hedef sonradan değişse de kayıt doğru okunur.
    """
    data: dict[str, Any] = {} if label is None else {"label": label}
    data.update(details or {})
    entry = AuditLog(
        user_id=user.id if user else None,
        action=AuditAction(action).value,
        target_type=AuditTargetType(target_type).value if target_type else None,
        target_id=target_id,
        details=data,
    )
    db.add(entry)
    return entry
