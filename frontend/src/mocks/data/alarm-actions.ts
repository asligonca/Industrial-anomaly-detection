import type { AlarmAction, EventStatus } from '@/types'
import type { EventRow } from '../rows'
import { events } from './events'

const operator = { id: 2, username: 'operator' }

/** ISO zamana dakika ekler. */
const after = (iso: string, minutes: number) =>
  new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()

/** Fixture olayının şimdiki durumuna nasıl gelindi: incelemeye alındı, sonra (varsa) kapandı. */
function historyOf(event: EventRow): Omit<AlarmAction, 'id'>[] {
  if (event.status === 'new') return []
  const step = (from: EventStatus, to: EventStatus, minutes: number, note: string | null) => ({
    event_id: event.id,
    from_status: from,
    to_status: to,
    note,
    user: operator,
    created_at: after(event.created_at, minutes),
  })
  const reviewing = step('new', 'reviewing', 2, null)
  if (event.status === 'reviewing') return [reviewing]
  const note =
    event.status === 'false_alarm' ? 'Kamera açısı yanıltıcı' : 'Saha ekibi bilgilendirildi'
  return [reviewing, step('reviewing', event.status, 9, note)]
}

/** Olayların durum geçmişi (`alarm_actions`), fixture olaylarından türetilir. */
export const alarmActions: AlarmAction[] = events
  .flatMap(historyOf)
  .sort((a, b) => a.created_at.localeCompare(b.created_at))
  .map((action, index) => ({ ...action, id: index + 1 }))
