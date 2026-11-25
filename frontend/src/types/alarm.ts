import type { AnomalyEvent } from './event'

/**
 * `WS /ws/alarms?token=<JWT>` mesajı. `data` liste öğesiyle aynı şekil (`GET /events`;
 * backend-notlari madde 40 doğrulanmadı).
 */
export interface AlarmMessage {
  type: 'event.created' | 'event.updated'
  data: AnomalyEvent
}

/** Bağlantı durumu: bağlanıyor, açık, koptu (yeniden denenecek), oturum geçersiz (denenmez). */
export type AlarmSocketStatus = 'connecting' | 'open' | 'closed' | 'unauthorized'
