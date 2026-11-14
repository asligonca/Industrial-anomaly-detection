/**
 * Denetim kaydı kodu -> Türkçe cümle. Backend kod döndürür (`camera.activated`), metni arayüz
 * üretir; dil değişirse yalnızca bu dosya değişir. Hedefin adı kayıt anındaki `details.label`'dan
 * gelir (kamera adı sonradan değişse de kayıt doğru okunur).
 */
import type { AuditAction, AuditLog, EventStatus } from '@/types'

/** Olay durumu değişikliğinin hedef duruma göre fiili. */
const statusChangeText: Record<EventStatus, string> = {
  new: 'olayı yeniden açıldı',
  reviewing: 'olayı incelemeye alındı',
  confirmed: 'olayı kapatıldı',
  false_alarm: 'yanlış alarm olarak işaretlendi',
}

const actionTexts: Record<AuditAction, (label: string) => string> = {
  'user.login': () => 'Oturum açıldı',
  'user.created': (label) => `${label} kullanıcısı eklendi`,
  'event.status_changed': (label) => `${label} olayının durumu değişti`,
  'camera.created': (label) => `${label} kamerası eklendi`,
  'camera.updated': (label) => `${label} kamerası yapılandırıldı`,
  'camera.activated': (label) => `${label} kamerası aktif yapıldı`,
  'camera.deactivated': (label) => `${label} kamerası pasif yapıldı`,
  'zone.created': (label) => `${label} bölgesi eklendi`,
  'zone.deactivated': (label) => `${label} bölgesi silindi`,
}

/** Bilinmeyen kodda (backend yeni işlem eklediyse) kodun kendisi yazılır, ekran çökmez. */
export function auditLogText(log: AuditLog): string {
  const label = log.details.label ?? (log.target_id === null ? '' : `#${log.target_id}`)
  if (log.action === 'event.status_changed' && log.details.to) {
    return `${label} ${statusChangeText[log.details.to]}`
  }
  const text = (actionTexts as Partial<Record<string, (label: string) => string>>)[log.action]
  return text ? text(label) : log.action
}

/** Kaydı yapan: kullanıcı adı ya da sistem işlemi. */
export function auditLogUser(log: AuditLog): string {
  return log.user?.username ?? 'Sistem'
}
