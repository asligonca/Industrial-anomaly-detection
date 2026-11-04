import { config } from '@/config'
import type { Camera } from '@/types'
import { apiBaseUrl, apiRequest } from './client'

export function getCameras(signal?: AbortSignal) {
  return apiRequest<Camera[]>('/cameras', { signal })
}

/**
 * Kamera kartındaki görüntünün adresi. `<img src>` olarak kullanılır.
 * Mock: `public/assets/cam-N.png` statik karesi. Gerçek: `GET /cameras/{id}/stream` (MJPEG).
 * Not: `<img>` Authorization başlığı gönderemez; backend'in akışı nasıl yetkilendireceği
 * kesinleşince (ör. kısa ömürlü token) burası güncellenecek.
 */
export function cameraFrameUrl(id: number): string {
  // BASE_URL ("/" ya da alt yol) sonda "/" taşır; uygulama alt yoldan yayınlansa da kare bulunur.
  return config.useMock
    ? `${import.meta.env.BASE_URL}assets/cam-${id}.png`
    : `${apiBaseUrl()}/cameras/${id}/stream`
}
