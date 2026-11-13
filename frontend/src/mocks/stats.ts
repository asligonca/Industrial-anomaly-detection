import { HOURS_PER_DAY, toDateInputValue } from '@/lib/format'
import type { AnomalyEvent, EventStats } from '@/types'

/** Anahtara göre sayar, en çoktan aza sıralar. Eşitlikte ilk görülen önde kalır. */
function countBy<K>(events: AnomalyEvent[], key: (e: AnomalyEvent) => K): [K, number][] {
  const counts = new Map<K, number>()
  for (const event of events) counts.set(key(event), (counts.get(key(event)) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1])
}

/**
 * `GET /events/stats` yanıtı, gerçek backend gibi verilen olaylardan hesaplanır.
 * Saat ve gün tarayıcının yerel saatine göre (backend'de tesisin saat dilimi).
 * `by_hour` her zaman 24 kayıt; tespit olmayan saat 0.
 */
export function buildEventStats(events: AnomalyEvent[]): EventStats {
  const hourly = Array.from({ length: HOURS_PER_DAY }, () => 0)
  for (const event of events) {
    const hour = new Date(event.created_at).getHours()
    hourly[hour] = (hourly[hour] ?? 0) + 1
  }

  return {
    by_type: countBy(events, (e) => e.type).map(([type, count]) => ({ type, count })),
    by_camera: countBy(events, (e) => e.camera_id)
      .map(([camera_id, count]) => ({ camera_id, count }))
      .sort((a, b) => a.camera_id - b.camera_id),
    by_day: countBy(events, (e) => toDateInputValue(new Date(e.created_at)))
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    by_hour: hourly.map((count, hour) => ({ hour, count })),
  }
}
