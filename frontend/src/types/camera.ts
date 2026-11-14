/** `cameras` tablosunun Read şeması. */
export interface Camera {
  id: number
  /** Backend id'den üretir: 3 -> "KAM-03" (olay koduyla aynı mantık). */
  code: string
  name: string
  location: string
  /**
   * RTSP adresi ya da video dosyası yolu. Parola backend'de maskelenir:
   * "rtsp://kullanici:***@10.0.1.11/stream" (gerçek parola API'den hiç dönmez).
   */
  stream_url: string
  is_active: boolean
  /** Ekrandaki kamera grubu (Üretim, Depo...). SQL'de `GROUP` ayrılmış kelime olduğu için `area`. */
  area: string
}

/** `POST /cameras` gövdesi. `location` boş, `is_active` verilmezse `true`. */
export interface CameraCreate {
  name: string
  area: string
  stream_url: string
  location?: string
  is_active?: boolean
}

/** `PATCH /cameras/{id}`: gönderilmeyen alan değişmez (`stream_url` dahil). */
export type CameraUpdate = Partial<CameraCreate>
