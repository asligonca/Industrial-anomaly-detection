import type { AgentsStatus } from '@/types'
import { apiRequest } from './client'

/** Ajan hattının durumu. Uç ve şekil öneri (backend-notlari madde 20). */
export function getAgentsStatus(signal?: AbortSignal) {
  return apiRequest<AgentsStatus>('/agents/status', { signal })
}
