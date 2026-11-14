import type { AlarmAction } from './alarm-action'

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

/** Backend `type`'tan doldurur (restricted_zone critical, no_helmet high, no_vest medium). */
export type Severity = 'critical' | 'high' | 'medium' | 'info'

/** `confirmed` ekranda "Kapandı" olarak görünür. Geçiş kuralları: `lib/eventRules`. */
export type EventStatus = 'new' | 'reviewing' | 'confirmed' | 'false_alarm'

/** Tespit kutusu: [x1, y1, x2, y2] (sol üst ve sağ alt köşe), görüntüye göre 0–1 arası. */
export type BBox = [number, number, number, number]

/** `anomaly_events` tablosunun Read şeması. */
export interface AnomalyEvent {
  id: number
  /** Backend id'den üretir: 14 -> "OLY-014" (DB'de tutulmaz). */
  code: string
  camera_id: number
  /** Kamera özeti (backend `selectinload` ile ekler); ad için ayrıca kamera listesi gerekmez. */
  camera: EventCameraRef
  zone_id: number | null
  type: EventType
  confidence: number
  severity: Severity
  bbox: BBox
  /**
   * Görüntünün adresi (`/api/events/{id}/snapshot`); görüntü yoksa `null`. `<img>` için
   * `eventSnapshotUrl` ile token eklenir. Sunucudaki dosya yolu (`snapshot_path`) API'de dönmez.
   */
  snapshot_url: string | null
  /** Takip yapılmayan tespitlerde `null`. */
  track_id: number | null
  status: EventStatus
  created_at: string
}

/** Olay yanıtındaki kamera özeti. */
export interface EventCameraRef {
  id: number
  name: string
  area: string
}

/** Olay detayındaki bölge özeti. */
export interface EventZoneRef {
  id: number
  name: string
}

/** `GET /events/{id}` yanıtı: liste kaydı + bölge, tespit modeli sürümü ve durum geçmişi. */
export interface EventDetail extends AnomalyEvent {
  zone: EventZoneRef | null
  /** Örn. "yolo26n-exp1" */
  model_version: string
  /** Durum değişiklikleri (`alarm_actions`). Sıra sözleşmede yok; ekran zamana göre sıralar. */
  actions: AlarmAction[]
}

/** Sıralanabilen alanlar. `severity`: critical > high > medium > info. */
export type EventSortField = 'created_at' | 'severity' | 'confidence'

/** `?sort=`: alan adı, başında `-` azalan. Varsayılan `-created_at`. */
export type EventSort = EventSortField | `-${EventSortField}`

/**
 * `GET /events` sorgu parametreleri. Tarihler ISO string ya da YYYY-MM-DD.
 * `status` ve `type` dizi olursa tekrarlı parametre gider: `?status=new&status=reviewing`.
 * (`type` takma adı bilerek: interface'ler `Record` olarak kullanılamaz.)
 */
export type EventFilters = {
  camera_id?: number
  /** Kamera grubu (Üretim, Depo...): `cameras.area`. */
  area?: string
  /** Dizi olursa tekrarlı parametre ("Diğer" kategorisi birden çok türü kapsar). */
  type?: EventType | EventType[]
  status?: EventStatus | EventStatus[]
  severity?: Severity | Severity[]
  /**
   * Serbest metin arama: olay no (OLY-014 ya da 14), kamera adı ya da kodu. Türkçe tür adlarını
   * arayüz `type`'a çevirir.
   */
  q?: string
  from?: string
  to?: string
  sort?: EventSort
  limit?: number
  offset?: number
}

/** `GET /events/stats` tarih aralığı. */
export type EventStatsRange = Pick<EventFilters, 'from' | 'to'>

/** Sayfalı liste yanıtı (tüm liste uçları). */
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

/** `GET /events/stats` yanıtı. */
export interface EventStats {
  by_type: { type: EventType; count: number }[]
  by_camera: { camera_id: number; count: number }[]
  /** date: YYYY-MM-DD */
  by_day: { date: string; count: number }[]
  /** hour: 0–23, tesisin yerel saati. 24 kayıt, tespit olmayan saat 0. */
  by_hour: { hour: number; count: number }[]
}
