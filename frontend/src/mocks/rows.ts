import type { AnomalyEvent } from '@/types'

/**
 * `anomaly_events` satırı, backend'in veritabanındaki gibi: kamera ve bölge özeti yok. Özetler
 * yanıtta eklenir (`mocks/handlers/events.ts` `toEventResponse`), ad değişince olay güncel kalır.
 * `model_version` da yanıtta eklenir: mock'taki tüm tespitler aynı modelden.
 */
export type EventRow = Omit<AnomalyEvent, 'camera' | 'zone' | 'model_version'>
