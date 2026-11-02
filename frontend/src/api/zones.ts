import type { Zone } from '@/types'
import { apiRequest } from './client'

export function getZones(signal?: AbortSignal) {
  return apiRequest<Zone[]>('/zones', { signal })
}
