/**
 * API kodu -> ekran etiketi. API'ye her zaman kod gider, ekrana her zaman etiket çıkar.
 * Backend kodları değiştirirse yalnızca bu dosya ve `src/types` güncellenir.
 */
import type { EventStatus, EventType, Role, RuleType, Severity } from '@/types'

export const eventTypeLabels: Record<EventType, string> = {
  restricted_zone: 'Yasak bölge',
  no_helmet: 'Baret yok',
  no_vest: 'Yelek yok',
  unregistered_visitor: 'Kayıtsız ziyaretçi',
  forklift_proximity: 'Forklift–yaya yakınlığı',
  no_face_shield: 'Yüz siperi yok',
  smoke_detected: 'Duman algılandı',
  person_near_equipment: 'Ekipman yanında insan',
}

/** İstatistik grafiğinde tür adları daha geniş gruplar halinde gösterilir. */
export const eventTypeStatLabels: Record<EventType, string> = {
  ...eventTypeLabels,
  no_helmet: 'Baret / KKD eksikliği',
  no_vest: 'Yelek eksikliği',
  unregistered_visitor: 'Ziyaretçi',
}

export const severityLabels: Record<Severity, string> = {
  critical: 'KRİTİK',
  high: 'YÜKSEK',
  medium: 'ORTA',
  info: 'BİLGİ',
}

export const eventStatusLabels: Record<EventStatus, string> = {
  new: 'Açık',
  reviewing: 'İnceleniyor',
  confirmed: 'Kapandı',
  false_alarm: 'Yanlış alarm',
}

export const ruleTypeLabels: Record<RuleType, string> = {
  restricted: 'Yasak bölge',
  ppe_helmet_vest: 'Baret ve yelek',
  ppe_helmet: 'Baret',
  ppe_vest: 'Yelek',
  forklift_proximity: 'Forklift–yaya yakınlığı',
  smoke_fire: 'Duman / yangın',
  person_near_equipment: 'Ekipman yanında insan',
}

/** Geçerli kodlar, etiket haritalarından türetilir; yeni kod eklenince tek yerde tutulur. */
export const eventTypes = Object.keys(eventTypeLabels) as EventType[]
export const eventStatuses = Object.keys(eventStatusLabels) as EventStatus[]

/** Operatörün ilgilenmesi gereken durumlar (Olaylar listesi, menü rozeti, kamera vurgusu). */
export const OPEN_STATUSES: EventStatus[] = ['new', 'reviewing']

export const isOpenStatus = (status: EventStatus) => OPEN_STATUSES.includes(status)

export const roleLabels: Record<Role, string> = {
  admin: 'Yönetici',
  operator: 'Operatör',
}

/** Olaylar ekranındaki filtre kategorisi. Saklanmaz, `type`'tan türetilir. */
export type EventCategory = 'helmet' | 'vest' | 'restricted' | 'other'

export const eventCategoryLabels: Record<EventCategory, string> = {
  helmet: 'Baret',
  vest: 'Yelek',
  restricted: 'Yasak bölge',
  other: 'Diğer',
}

export function eventCategory(type: EventType): EventCategory {
  if (type === 'no_helmet') return 'helmet'
  if (type === 'no_vest') return 'vest'
  if (type === 'restricted_zone') return 'restricted'
  return 'other'
}

/** 14 -> "OLY-014" */
export function eventCode(id: number): string {
  return `OLY-${String(id).padStart(3, '0')}`
}

/** 6 -> "KAM-06" */
export function cameraCode(id: number): string {
  return `KAM-${String(id).padStart(2, '0')}`
}
