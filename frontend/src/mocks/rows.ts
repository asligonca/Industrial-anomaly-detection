import type { AnomalyEvent } from '@/types'

/**
 * `anomaly_events` satırı, backend'in veritabanındaki gibi: kamera özeti yok. `camera` yanıtta
 * eklenir (`mocks/handlers/events.ts` `toEventResponse`), kamera adı değişince olay güncel kalır.
 */
export type EventRow = Omit<AnomalyEvent, 'camera'>
