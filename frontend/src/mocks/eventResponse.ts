import type { AnomalyEvent, EventDetail } from '@/types'
import { cameraNameOf, db, findCamera } from './db'
import type { EventRow } from './rows'

/** Mock'taki tüm tespitler aynı modelden geliyor sayılır. */
export const MODEL_VERSION = 'yolo26n-exp1'

/** Liste öğesi: satır + kamera ve bölge özeti, model sürümü (backend `selectinload` ile ekler). */
export function toEventResponse(row: EventRow): AnomalyEvent {
  const zone = db.zones.find((z) => z.id === row.zone_id)
  return {
    ...row,
    camera: {
      id: row.camera_id,
      name: cameraNameOf(row.camera_id),
      area: findCamera(row.camera_id)?.area ?? '',
    },
    zone: zone ? { id: zone.id, name: zone.name } : null,
    model_version: MODEL_VERSION,
  }
}

/** Detay: liste öğesi + durum geçmişi (eskiden yeniye). */
export function toDetail(row: EventRow): EventDetail {
  return {
    ...toEventResponse(row),
    actions: db.alarmActions
      .filter((a) => a.event_id === row.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }
}
