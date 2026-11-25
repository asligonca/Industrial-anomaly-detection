import { config } from '@/config'
import type { AlarmMessage } from '@/types'
import { ws } from 'msw'
import { toEventResponse } from '../eventResponse'
import type { EventRow } from '../rows'
import { createSimulatedEvent, startSimulator } from '../simulator'
import { userFromToken } from '../utils'

/** Backend'in geçersiz token'da kullanacağı kapanış kodu (WebSocket'te HTTP 401 yok). */
const UNAUTHORIZED_CODE = 4401

/** `WS /ws/alarms?token=<JWT>` (`/api` öneksiz). Sorgu dizgisi eşleşmede yok sayılır. */
const alarms = ws.link(config.wsUrl)

/** Bağlı bütün istemcilere olay mesajı gönderir. `data` liste öğesiyle aynı şekil. */
export function broadcastAlarm(type: AlarmMessage['type'], row: EventRow) {
  const message: AlarmMessage = { type, data: toEventResponse(row) }
  alarms.broadcast(JSON.stringify(message))
}

export const alarmHandlers = [
  alarms.addEventListener('connection', ({ client }) => {
    if (!userFromToken(client.url.searchParams.get('token'))) {
      client.close(UNAUTHORIZED_CODE, 'Oturum geçersiz ya da süresi dolmuş')
      return
    }
    // İlk bağlantıda başlar; sonrakilerde bir şey yapmaz.
    if (config.mockSimulator) startSimulator(broadcastAlarm)
  }),
]

/** Simülatörü beklemeden bir olay üretir (geliştirme / demo). Kamera yoksa bir şey yapmaz. */
export function simulateEventNow() {
  const row = createSimulatedEvent()
  if (row) broadcastAlarm('event.created', row)
  return row?.code ?? null
}
