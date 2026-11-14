import type { EventStatus } from './event'
import type { UserRef } from './user'

/** Denetim kaydı işlem kodları. Türkçe metni ön yüz üretir (`lib/auditText.ts`). */
export type AuditAction =
  | 'user.login'
  | 'user.created'
  | 'event.status_changed'
  | 'camera.created'
  | 'camera.updated'
  | 'camera.activated'
  | 'camera.deactivated'
  | 'zone.created'
  | 'zone.deactivated'

export type AuditTargetType = 'user' | 'event' | 'camera' | 'zone'

/**
 * Kayıt anındaki görüntü bilgisi. `label` hedefin o anki adı ("KAM-07", "Kırmızı alan",
 * "OLY-010"): hedef sonradan değişse de kayıt doğru okunur.
 */
export interface AuditDetails {
  label?: string
  /** `event.status_changed` */
  from?: EventStatus
  to?: EventStatus
}

/** `GET /audit-logs` satırı (yalnızca admin). */
export interface AuditLog {
  id: number
  /** Sistem işlemlerinde null. */
  user: UserRef | null
  action: AuditAction
  target_type: AuditTargetType | null
  target_id: number | null
  details: AuditDetails
  created_at: string
}
