import type { EventStatus } from './event'
import type { UserRef } from './user'

/** `alarm_actions` tablosunun Read şeması: kim, olayı hangi durumdan hangisine, ne zaman geçirdi. */
export interface AlarmAction {
  id: number
  event_id: number
  from_status: EventStatus
  to_status: EventStatus
  note: string | null
  user: UserRef
  created_at: string
}
