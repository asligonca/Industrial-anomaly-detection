import { eventCode } from '@/lib/labels'
import { mockCameraFrame, mockSubjectBox } from '@/lib/mockCameraAssets'
import type { AlarmMessage, EventType, Severity } from '@/types'
import { db, nextId } from './db'
import type { EventRow } from './rows'

/** Yeni sahte olay aralığı. */
export const SIMULATOR_INTERVAL_MS = 45_000

/**
 * Backend'in şimdilik tanıdığı türler ve önemleri (backend `EVENT_TYPE_SEVERITY`). Dedektör yalnızca
 * bunları üretir; mock'taki diğer türler eski kayıtlarda kalır.
 */
const typeSeverity: [EventType, Severity][] = [
  ['restricted_zone', 'critical'],
  ['no_helmet', 'high'],
  ['no_vest', 'medium'],
]

type Broadcast = (type: AlarmMessage['type'], row: EventRow) => void

let timer: number | undefined

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)]!
const round2 = (n: number) => Math.round(n * 100) / 100

/** Aktif bir kameradan yeni olay satırı (backend'in dedektörden aldığı gibi). Kamera yoksa null. */
export function createSimulatedEvent(): EventRow | null {
  const cameras = db.cameras.filter((c) => c.is_active)
  if (cameras.length === 0) return null
  const camera = pick(cameras)
  const zones = db.zones.filter((z) => z.camera_id === camera.id && z.is_active)
  const [type, severity] = pick(typeSeverity)
  const id = nextId(db.events)
  const row: EventRow = {
    id,
    code: eventCode(id),
    camera_id: camera.id,
    zone_id: zones.length > 0 ? pick(zones).id : null,
    type,
    confidence: round2(0.6 + Math.random() * 0.37),
    severity,
    bbox: mockSubjectBox(camera.id),
    snapshot_url: mockCameraFrame(camera.id),
    track_id: 400 + Math.floor(Math.random() * 600),
    status: 'new',
    created_at: new Date().toISOString(),
  }
  db.events.push(row)
  return row
}

/**
 * Mock modda belirli aralıkla yeni olay üretip `event.created` gönderir (backend simülatörü gibi).
 * İlk WebSocket bağlantısında başlar, sayfa kapanınca biter. Tekrar çağrılırsa bir şey yapmaz.
 */
export function startSimulator(broadcast: Broadcast) {
  if (timer !== undefined) return
  timer = window.setInterval(() => {
    const row = createSimulatedEvent()
    if (row) broadcast('event.created', row)
  }, SIMULATOR_INTERVAL_MS)
}
