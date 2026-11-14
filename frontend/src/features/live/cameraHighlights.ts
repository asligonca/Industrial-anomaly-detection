import { isOpenStatus } from '@/lib/labels'
import type { AnomalyEvent, Severity } from '@/types'

/** Kamera kartında gösterilen açık olay ve o kameradaki diğer açık olay sayısı. */
export interface CameraHighlight {
  event: AnomalyEvent
  /** Gösterilen olay dışındaki açık olay sayısı; etikette "+N" olur. */
  others: number
}

const severityRank: Record<Severity, number> = { critical: 3, high: 2, medium: 1, info: 0 }

/** Önemi yüksek olan önce; eşitse yeni olan. */
function outranks(a: AnomalyEvent, b: AnomalyEvent): boolean {
  const bySeverity = severityRank[a.severity] - severityRank[b.severity]
  if (bySeverity !== 0) return bySeverity > 0
  return Date.parse(a.created_at) > Date.parse(b.created_at)
}

/** Açık olayları kameraya göre toplar; her kamera için en önemli olayı seçer. */
export function cameraHighlights(events: readonly AnomalyEvent[]): Map<number, CameraHighlight> {
  const byCamera = new Map<number, CameraHighlight>()
  for (const event of events) {
    // Sorgu zaten açık olayları ister; önbellek elle güncellenirse (FE-6/FE-11) kapalılar girmesin.
    if (!isOpenStatus(event.status)) continue
    const current = byCamera.get(event.camera_id)
    if (!current) {
      byCamera.set(event.camera_id, { event, others: 0 })
    } else {
      current.others += 1
      if (outranks(event, current.event)) current.event = event
    }
  }
  return byCamera
}
