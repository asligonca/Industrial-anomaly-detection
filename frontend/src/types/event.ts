/** `anomaly_events.type` */
export type EventType =
  | 'restricted_zone'
  | 'no_helmet'
  | 'no_vest'
  | 'unregistered_visitor'
  | 'forklift_proximity'
  | 'no_face_shield'
  | 'smoke_detected'
  | 'person_near_equipment'

/** FE-12 (#25) önerisi, docx'te yok. */
export type Severity = 'critical' | 'high' | 'medium' | 'info'

/** `reviewing` FE-12 (#25) önerisi. `confirmed` ekranda "Kapandı" olarak görünür. */
export type EventStatus = 'new' | 'reviewing' | 'confirmed' | 'false_alarm'

/** Tespit kutusu: [x1, y1, x2, y2] (sol üst ve sağ alt köşe), görüntüye göre 0–1 arası. */
export type BBox = [number, number, number, number]

/** `anomaly_events` tablosunun Read şeması. */
export interface AnomalyEvent {
  id: number
  camera_id: number
  zone_id: number | null
  type: EventType
  confidence: number
  severity: Severity
  bbox: BBox
  /** Sunucudaki dosya yolu (tablo sütunu). Ekranda kullanılmaz. */
  snapshot_path: string
  /** Görüntünün adresi. `<img>` için `eventSnapshotUrl` ile token eklenir. */
  snapshot_url: string
  track_id: number
  status: EventStatus
  created_at: string
}

/** Olay detayındaki bölge özeti. */
export interface EventZoneRef {
  id: number
  name: string
}

/** `GET /events/{id}` yanıtı: liste kaydı + bölge adı ve tespit modeli sürümü. */
export interface EventDetail extends AnomalyEvent {
  zone: EventZoneRef | null
  /** Örn. "yolo26n-exp1" */
  model_version: string
}

/**
 * `GET /events` sorgu parametreleri. Tarihler ISO string ya da YYYY-MM-DD.
 * `status` ve `type` dizi olursa tekrarlı parametre gider: `?status=new&status=reviewing`.
 * (`type` takma adı bilerek: interface'ler `Record` olarak kullanılamaz.)
 */
export type EventFilters = {
  camera_id?: number
  /** Dizi hali FE-12 (#25) önerisi ("Diğer" kategorisi birden çok türü kapsar). */
  type?: EventType | EventType[]
  status?: EventStatus | EventStatus[]
  /**
   * Serbest metin arama: olay no (OLY-014 ya da 14), kamera adı/kodu, tür adı ya da kodu.
   * FE-12 (#25) önerisi.
   */
  q?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

/** `GET /events/stats` tarih aralığı. */
export type EventStatsRange = Pick<EventFilters, 'from' | 'to'>

/** Liste yanıtı. FE-12 (#25)'e eklenecek öneri. */
export interface Paginated<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

/** `PATCH /events/{id}/status` gövdesi */
export interface EventStatusUpdate {
  status: EventStatus
  note?: string
}

/** `GET /events/stats` yanıtı. Şekil FE-12 (#25) önerisi. */
export interface EventStats {
  by_type: { type: EventType; count: number }[]
  by_camera: { camera_id: number; count: number }[]
  /** date: YYYY-MM-DD */
  by_day: { date: string; count: number }[]
  /** hour: 0–23, tesisin yerel saati. 24 kayıt, tespit olmayan saat 0. */
  by_hour: { hour: number; count: number }[]
}
