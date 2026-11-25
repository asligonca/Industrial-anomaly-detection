import type { EventStatus } from './event'
import type { UserRef } from './user'

/** `alarm_actions` tablosunun Read şeması: kim, olayı hangi durumdan hangisine, ne zaman geçirdi. */
export interface AlarmAction {
  id: number
  event_id: number
  from_status: EventStatus
  to_status: EventStatus
  note: string | null
  /** İşlemi yapan; kullanıcı silinmişse `null`. */
  user: UserRef | null
  created_at: string
}
