import type { Camera } from '@/types'

/**
 * Kameralardaki alan (grup) adları, ilk görülme sırasıyla ve tekrarsız. Canlı izlemedeki filtre
 * çipleri ve kamera ekleme formundaki öneriler bunu kullanır.
 */
export function cameraAreas(cameras: readonly Camera[]): string[] {
  return [...new Set(cameras.map((camera) => camera.area))]
}
