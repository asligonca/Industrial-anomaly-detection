import type { Zone, ZoneCreate } from '@/types'
import { apiRequest } from './client'

export function getZones(signal?: AbortSignal) {
  return apiRequest<Zone[]>('/zones', { signal })
}

/** Yalnızca admin. */
export function createZone(zone: ZoneCreate) {
  return apiRequest<Zone>('/zones', { method: 'POST', json: zone })
}

/** Yalnızca admin. Yanıt 204 (gövdesiz). */
export function deleteZone(id: number) {
  return apiRequest<void>(`/zones/${id}`, { method: 'DELETE' })
}
