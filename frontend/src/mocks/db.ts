/**
 * Mock'un bellekteki "veritabanı". Fixture'ların kopyasıyla başlar; PATCH gibi istekler
 * bunu değiştirir, böylece sonraki GET istekleri güncel veriyi görür.
 * Sayfa yenilenince fixture'a geri döner.
 */
import type {
  AgentLog,
  AuditAction,
  AuditDetails,
  AuditLog,
  AuditTargetType,
  EventStatus,
  User,
} from '@/types'
import { alarmActions } from './data/alarm-actions'
import { auditLogs } from './data/audit-logs'
import { cameras } from './data/cameras'
import { events } from './data/events'
import { mockPasswords, users } from './data/users'
import { zones } from './data/zones'
import type { EventRow } from './rows'

export const db = {
  users: structuredClone(users),
  cameras: structuredClone(cameras),
  zones: structuredClone(zones),
  events: structuredClone(events),
  alarmActions: structuredClone(alarmActions),
  agentLogs: [] as AgentLog[],
  auditLogs: structuredClone(auditLogs),
  /** Kullanıcı adı -> parola. Yalnızca mock; yeni kullanıcı eklenince buraya da yazılır. */
  passwords: structuredClone(mockPasswords),
}

/** Kamera kaydı (silinmiş / bilinmeyen id'de `undefined`). */
export const findCamera = (id: number) => db.cameras.find((c) => c.id === id)

/**
 * Kameranın adı; kamera yoksa "Bilinmeyen kamera". Kod değil: ekranlar zaten "KAM-07 · ad" yazıyor,
 * kod yedek olunca "KAM-07 · KAM-07" çıkıyordu. (Backend'de olamaz: yabancı anahtar, kamera silinmez.)
 */
export const cameraNameOf = (id: number) => findCamera(id)?.name ?? 'Bilinmeyen kamera'

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
  event: EventRow,
  status: EventStatus,
  user: User,
  note: string | null = null,
): EventRow {
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
    { label: event.code, from, to: status },
  )
  return event
}
