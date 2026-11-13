import { OPEN_STATUSES } from '@/lib/labels'
import { useEvents } from './useEvents'

/** API'nin izin verdiği en büyük sayfa. Açık olay bundan fazlaysa en yeni 200'ü gelir. */
export const OPEN_EVENTS_LIMIT = 200

/**
 * Açık (yeni + inceleniyor) olaylar, en yeni önce. Canlı izleme ve Olaylar listesi aynı sorguyu
 * kullanır, böylece önbellek paylaşılır.
 */
export function useOpenEvents() {
  return useEvents({ status: OPEN_STATUSES, limit: OPEN_EVENTS_LIMIT })
}
