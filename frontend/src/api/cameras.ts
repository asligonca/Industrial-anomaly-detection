import type { Camera } from '@/types'
import { apiRequest } from './client'

export function getCameras(signal?: AbortSignal) {
  return apiRequest<Camera[]>('/cameras', { signal })
}
