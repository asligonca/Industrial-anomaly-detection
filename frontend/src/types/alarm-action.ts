import type { EventStatus } from './event'

/** `alarm_actions` tablosunun Read şeması: kim, hangi alarmı, ne zaman. */
export interface AlarmAction {
  id: number
  event_id: number
  user_id: number
  /** Olayın geçirildiği yeni durum */
  action: EventStatus
  note: string | null
  created_at: string
}
