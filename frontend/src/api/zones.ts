import type { Paginated, Zone, ZoneCreate } from '@/types'
import { apiRequest } from './client'

/** Sayfalı zarf; bölge sayısı az, tek istekte en çok 200. `useZones` `.items`'ı döner. */
export function getZones(signal?: AbortSignal) {
  return apiRequest<Paginated<Zone>>('/zones', { query: { limit: 200 }, signal })
}

/** Yalnızca admin. */
export function createZone(zone: ZoneCreate) {
  return apiRequest<Zone>('/zones', { method: 'POST', json: zone })
}

/** Yalnızca admin. Yanıt 204 (gövdesiz). */
export function deleteZone(id: number) {
  return apiRequest<void>(`/zones/${id}`, { method: 'DELETE' })
}
