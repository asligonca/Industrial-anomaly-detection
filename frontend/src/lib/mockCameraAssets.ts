import type { BBox } from '@/types'
import { publicAssetUrl } from './publicAssetUrl'

/**
 * Yalnızca mock modda: kamera karesi `public/assets/cam-1.png` … `cam-6.png`. Sonradan eklenen
 * kameralar (7, 8 …) bu 6 kareyi sırayla kullanır; "Bağlantı yok" görünmez.
 */
const ASSET_COUNT = 6

const assetIndex = (cameraId: number) => ((cameraId - 1) % ASSET_COUNT) + 1

export function mockCameraFrame(cameraId: number): string {
  return publicAssetUrl(`assets/cam-${assetIndex(cameraId)}.png`)
}

/**
 * Karedeki tespit kutusu ([x1, y1, x2, y2], 0–1). Kareler stok fotoğraf (çizili kutu yok); kutu
 * her karede belirgin bir nesnenin üstüne oturur. İnsan yalnızca 3. karede var (baretli işçi).
 */
const subjectBoxes: Record<number, BBox> = {
  1: [0.29, 0.1, 0.4, 0.75], // robot kolu / direk
  2: [0.05, 0.56, 0.36, 0.95], // alt raftaki paletler
  3: [0.62, 0, 1, 1], // işçi
  4: [0.38, 0.12, 0.5, 0.27], // kasa
  5: [0.4, 0.15, 0.55, 0.72], // makine kafası
  6: [0.53, 0.68, 0.67, 0.8], // kamyonet
}

export function mockSubjectBox(cameraId: number): BBox {
  return subjectBoxes[assetIndex(cameraId)]!
}
