import { config } from '@/config'
import { publicAssetUrl } from '@/lib/publicAssetUrl'
import type { Camera, CameraCreate, CameraUpdate } from '@/types'
import { apiBaseUrl, apiRequest, withToken } from './client'

export function getCameras(signal?: AbortSignal) {
  return apiRequest<Camera[]>('/cameras', { signal })
}

/** Yalnızca admin. */
export function createCamera(camera: CameraCreate) {
  return apiRequest<Camera>('/cameras', { method: 'POST', json: camera })
}

/** Yalnızca admin. Gönderilmeyen alanlar değişmez (aktif / pasif için `{ is_active }`). */
export function updateCamera(id: number, update: CameraUpdate) {
  return apiRequest<Camera>(`/cameras/${id}`, { method: 'PATCH', json: update })
}

/**
 * Kamera kartındaki görüntünün adresi. `<img src>` olarak kullanılır.
 * Mock: `public/assets/cam-N.png` statik karesi. Gerçek: `GET /cameras/{id}/stream` (MJPEG).
 * `<img>` Authorization başlığı gönderemez; token `?token=` ile gider (`withToken`).
 */
export function cameraFrameUrl(id: number): string {
  return withToken(
    config.useMock
      ? publicAssetUrl(`assets/cam-${id}.png`)
      : `${apiBaseUrl()}/cameras/${id}/stream`,
  )
}
