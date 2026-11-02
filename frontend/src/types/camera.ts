/** `cameras` tablosunun Read şeması. */
export interface Camera {
  id: number
  name: string
  location: string
  /** RTSP adresi ya da video dosyası yolu */
  stream_url: string
  is_active: boolean
  /** FE-12 (#25) önerisi: ekrandaki kamera grubu (Üretim, Depo...). */
  group: string
}

export type CameraCreate = Omit<Camera, 'id'>

export type CameraUpdate = Partial<CameraCreate>
