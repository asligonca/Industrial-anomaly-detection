/**
 * Mock ajan analizi: olayın türü, önemi ve kamerasından şablon cümleler kurar (tasarımdaki gibi).
 * Gerçekte bu metinleri ajanlar üretir; şekil `EventAnalysis` tipiyle aynı kalır.
 */
import { formatConfidence } from '@/lib/format'
import { eventTypeLabel, severityLabels } from '@/lib/labels'
import type { AnomalyEvent, EventAnalysis, EventType, Severity } from '@/types'
import { db } from './db'

const regulationTexts: Record<EventType, string> = {
  restricted_zone:
    'Bölge, tesis iç talimatında yalnızca yetkili personele açıktır. Kimyasal koruyucu tulum ve maske zorunludur. Risk sınıfı: yüksek.',
  no_helmet: 'Alanda baret kullanımı zorunludur. KKD Yönetmeliği kapsamında ihlal.',
  no_vest: 'Alanda reflektörlü yelek zorunludur. KKD Yönetmeliği kapsamında ihlal.',
  unregistered_visitor:
    'Tesise yalnızca kayıtlı ziyaretçi kartıyla girilebilir. Güvenlik birimi bilgilendirilmelidir.',
  forklift_proximity: 'Forklift ve yaya yolları ayrılmalıdır. Risk sınıfı: yüksek.',
  no_face_shield:
    'Kaynak ve taşlama işlerinde yüz siperi zorunludur. KKD Yönetmeliği kapsamında ihlal.',
  smoke_detected: 'Yangın riski. Acil durum prosedürü uygulanmalıdır.',
  person_near_equipment: 'Ekipman çalışma alanında personel bulunması yasaktır.',
}

const coordinatorAdvice: Record<Severity, string> = {
  critical: 'Bölge sorumlusunun bilgilendirilmesi ve sahaya anons yapılması öneriliyor.',
  high: 'Bölge sorumlusunun bilgilendirilmesi ve sahaya anons yapılması öneriliyor.',
  medium: 'Vardiya amirinin bilgilendirilmesi öneriliyor.',
  info: 'Kayıt altına alındı, ek işlem gerekmiyor.',
}

/** Her adımın olaydan sonra bittiği an (ms). Sonuncusu toplam süredir. */
const STEP_OFFSETS_MS = [300, 700, 1200] as const

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

export function buildEventAnalysis(event: AnomalyEvent): EventAnalysis {
  const createdAt = new Date(event.created_at)
  const at = (ms: number) => new Date(createdAt.getTime() + ms).toISOString()
  const cameraName = db.cameras.find((c) => c.id === event.camera_id)?.name ?? 'Bilinmeyen kamera'
  const type = eventTypeLabel(event.type).toLocaleLowerCase('tr')
  const sameCameraToday = db.events.filter(
    (e) => e.camera_id === event.camera_id && sameDay(new Date(e.created_at), createdAt),
  ).length
  const [watcherMs, regulationMs, coordinatorMs] = STEP_OFFSETS_MS

  return {
    event_id: event.id,
    steps: [
      {
        agent: 'watcher',
        at: at(watcherMs),
        text:
          `${cameraName} kamerasında ${type} tespit edildi, güven ` +
          `${formatConfidence(event.confidence)}. Aynı kamerada bugün ${sameCameraToday} kayıt var.`,
      },
      { agent: 'regulation', at: at(regulationMs), text: regulationTexts[event.type] },
      {
        agent: 'coordinator',
        at: at(coordinatorMs),
        text:
          `Olay ${severityLabels[event.severity].toLocaleLowerCase('tr')} olarak sınıflandırıldı. ` +
          coordinatorAdvice[event.severity],
      },
    ],
    total_ms: coordinatorMs,
  }
}
