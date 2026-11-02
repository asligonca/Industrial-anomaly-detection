import type { Camera } from '@/types'

export const cameras: Camera[] = [
  {
    id: 1,
    name: 'Üretim Hattı A',
    location: 'Tesis 2 · Üretim',
    stream_url: 'rtsp://10.0.1.11/stream',
    is_active: true,
    group: 'Üretim',
  },
  {
    id: 2,
    name: 'Depo Rafları',
    location: 'Tesis 2 · Depo',
    stream_url: 'rtsp://10.0.1.12/stream',
    is_active: true,
    group: 'Depo',
  },
  {
    id: 3,
    name: 'Kimyasal Depo',
    location: 'Tesis 2 · Kimyasal alan',
    stream_url: 'rtsp://10.0.1.13/stream',
    is_active: true,
    group: 'Kısıtlı bölgeler',
  },
  {
    id: 4,
    name: 'Yükleme Rampası',
    location: 'Tesis 2 · Sevkiyat',
    stream_url: 'rtsp://10.0.1.14/stream',
    is_active: true,
    group: 'Depo',
  },
  {
    id: 5,
    name: 'Kaynak Atölyesi',
    location: 'Tesis 1 · Atölye',
    stream_url: 'rtsp://10.0.1.15/stream',
    // Çevrimdışı durumunu test etmek için kapalı.
    is_active: false,
    group: 'Üretim',
  },
  {
    id: 6,
    name: 'Ana Giriş',
    location: 'Tesis 1 · Giriş',
    stream_url: 'rtsp://10.0.1.16/stream',
    is_active: true,
    group: 'Kısıtlı bölgeler',
  },
]
