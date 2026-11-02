/**
 * Mock'un bellekteki "veritabanı". Fixture'ların kopyasıyla başlar; PATCH gibi istekler
 * bunu değiştirir, böylece sonraki GET istekleri güncel veriyi görür.
 * Sayfa yenilenince fixture'a geri döner.
 */
import { eventCode } from '@/lib/labels'
import type { AgentLog, AlarmAction, AnomalyEvent, AuditLog, EventStatus, User } from '@/types'
import { auditLogs } from './data/audit-logs'
import { cameras } from './data/cameras'
import { events } from './data/events'
import { users } from './data/users'
import { zones } from './data/zones'

export const db = {
  users: structuredClone(users),
  cameras: structuredClone(cameras),
  zones: structuredClone(zones),
  events: structuredClone(events),
  alarmActions: [] as AlarmAction[],
  agentLogs: [] as AgentLog[],
  auditLogs: structuredClone(auditLogs),
}

function nextId(rows: { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1
}

export function addAuditLog(user: string, text: string): AuditLog {
  const row: AuditLog = {
    id: nextId(db.auditLogs),
    user,
    text,
    created_at: new Date().toISOString(),
  }
  db.auditLogs.push(row)
  return row
}

export function addAgentLog(user: User, query: string, response: string): AgentLog {
  const row: AgentLog = {
    id: nextId(db.agentLogs),
    user_id: user.id,
    query,
    response,
    created_at: new Date().toISOString(),
  }
  db.agentLogs.push(row)
  return row
}

/** Denetim kaydında olayın durumu değişikliğini anlatan ifade. */
const statusChangeText: Record<EventStatus, string> = {
  new: 'olayı yeniden açıldı',
  reviewing: 'olayı incelemeye alındı',
  confirmed: 'olayı kapatıldı',
  false_alarm: 'yanlış alarm olarak işaretlendi',
}

/** Olayın durumunu değiştirir; backend'deki gibi alarm_actions ve denetim kaydı düşer. */
export function setEventStatus(
  event: AnomalyEvent,
  status: EventStatus,
  user: User,
  note: string | null = null,
): AnomalyEvent {
  event.status = status
  db.alarmActions.push({
    id: nextId(db.alarmActions),
    event_id: event.id,
    user_id: user.id,
    action: status,
    note,
    created_at: new Date().toISOString(),
  })
  addAuditLog(user.username, `${eventCode(event.id)} ${statusChangeText[status]}`)
  return event
}
