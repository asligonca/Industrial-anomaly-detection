/**
 * Mock'un bellekteki "veritabanı". Fixture'ların kopyasıyla başlar; PATCH gibi istekler
 * bunu değiştirir, böylece sonraki GET istekleri güncel veriyi görür.
 * Sayfa yenilenince fixture'a geri döner.
 */
import { eventCode } from '@/lib/labels'
import type {
  AgentLog,
  AlarmAction,
  AnomalyEvent,
  AuditAction,
  AuditDetails,
  AuditLog,
  AuditTargetType,
  EventStatus,
  User,
} from '@/types'
import { auditLogs } from './data/audit-logs'
import { cameras } from './data/cameras'
import { events } from './data/events'
import { mockPasswords, users } from './data/users'
import { zones } from './data/zones'

export const db = {
  users: structuredClone(users),
  cameras: structuredClone(cameras),
  zones: structuredClone(zones),
  events: structuredClone(events),
  alarmActions: [] as AlarmAction[],
  agentLogs: [] as AgentLog[],
  auditLogs: structuredClone(auditLogs),
  /** Kullanıcı adı -> parola. Yalnızca mock; yeni kullanıcı eklenince buraya da yazılır. */
  passwords: structuredClone(mockPasswords),
}

export function nextId(rows: { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1
}

interface AuditTarget {
  type: AuditTargetType
  id: number
}

/**
 * Backend gibi kod yazar, metin değil (Türkçe metni arayüz üretir). `details.label` hedefin o anki
 * adı: hedef sonradan değişse de kayıt doğru okunur. `user` null ise sistem işlemi.
 */
export function addAuditLog(
  user: User | null,
  action: AuditAction,
  target: AuditTarget | null,
  details: AuditDetails = {},
): AuditLog {
  const row: AuditLog = {
    id: nextId(db.auditLogs),
    user: user && { id: user.id, username: user.username },
    action,
    target_type: target?.type ?? null,
    target_id: target?.id ?? null,
    details,
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

/** Olayın durumunu değiştirir; backend'deki gibi alarm_actions ve denetim kaydı düşer. */
export function setEventStatus(
  event: AnomalyEvent,
  status: EventStatus,
  user: User,
  note: string | null = null,
): AnomalyEvent {
  const from = event.status
  event.status = status
  db.alarmActions.push({
    id: nextId(db.alarmActions),
    event_id: event.id,
    from_status: from,
    to_status: status,
    note,
    user: { id: user.id, username: user.username },
    created_at: new Date().toISOString(),
  })
  addAuditLog(
    user,
    'event.status_changed',
    { type: 'event', id: event.id },
    { label: eventCode(event.id), from, to: status },
  )
  return event
}
