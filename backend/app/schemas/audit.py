from typing import Any

from pydantic import BaseModel, ConfigDict

from app.schemas.common import UtcDateTime
from app.schemas.event import UserRef


class AuditLogRead(BaseModel):
    """`GET /api/audit-logs` satırı. Metin değil kod döner; Türkçe metni ön yüz üretir.

    `details.label` kayıt anındaki görüntü adı; `event.status_changed` için ayrıca
    `details.from` ve `details.to`. Sistem işlemlerinde ya da kullanıcı silinmişse `user` null.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    user: UserRef | None
    action: str
    target_type: str | None
    target_id: int | None
    details: dict[str, Any]
    created_at: UtcDateTime
