import type { EventStats } from '@/types'
import { atDay } from './time'

/**
 * Grafiklerin tasarımdaki gibi görünmesi için sabit değerler (toplam 47).
 * 10 olaylık fixture'dan hesaplanmaz, bilerek ayrı tutuldu.
 */
const hourly = [1, 0, 1, 0, 1, 2, 3, 5, 6, 7, 6, 5, 6, 4]

const dayCounts = [38, 52, 41, 29, 33, 44, 47] // 6 gün önce ... bugün

export const eventStats: EventStats = {
  by_type: [
    { type: 'no_helmet', count: 18 },
    { type: 'no_vest', count: 12 },
    { type: 'forklift_proximity', count: 7 },
    { type: 'restricted_zone', count: 6 },
    { type: 'unregistered_visitor', count: 4 },
  ],
  by_camera: [
    { camera_id: 1, count: 14 },
    { camera_id: 2, count: 9 },
    { camera_id: 3, count: 6 },
    { camera_id: 4, count: 10 },
    { camera_id: 5, count: 4 },
    { camera_id: 6, count: 4 },
  ],
  by_day: dayCounts.map((count, i) => ({
    date: atDay(dayCounts.length - 1 - i, '12:00:00').slice(0, 10),
    count,
  })),
  by_hour: hourly.map((count, hour) => ({ hour, count })),
}
