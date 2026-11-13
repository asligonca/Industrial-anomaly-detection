import {
  eventCategories,
  eventCategoryTypes,
  eventTypesMatching,
  type EventCategory,
} from '@/lib/labels'
import type { EventFilters, EventStatsRange } from '@/types'

export const RECORDS_PAGE_SIZE = 20

export type RecordsCategory = EventCategory | 'all'

/**
 * Seçilen gün aralığı, `<input type="date">` değerleriyle (yerel gün, YYYY-MM-DD).
 * API'ye giderken `toStatsRange` ile saat dilimli ISO'ya çevrilir.
 */
export interface DayRange {
  /** Boşsa alt sınır yok. */
  from: string
  /** O günün sonu dahil. Boşsa üst sınır yok. */
  to: string
}

/**
 * Kayıtlar ekranının filtreleri. Adres çubuğunda tutulur (`?q=baret&cat=helmet&from=...&page=2`):
 * olay detayından geri dönünce filtreler kaybolmaz, bağlantı paylaşılabilir.
 */
export interface RecordsFilters extends DayRange {
  q: string
  category: RecordsCategory
  /** 1'den başlar. */
  page: number
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

function readDay(params: URLSearchParams, key: string): string {
  const value = params.get(key) ?? ''
  return DATE_ONLY.test(value) && !Number.isNaN(new Date(value).getTime()) ? value : ''
}

/** Adresteki geçersiz değerler sessizce varsayılana döner (elle yazılmış adres sayfayı bozmasın). */
export function parseRecordsFilters(params: URLSearchParams): RecordsFilters {
  const category = params.get('cat')
  const page = Number(params.get('page') ?? 1)
  return {
    q: params.get('q') ?? '',
    category: eventCategories.includes(category as EventCategory)
      ? (category as EventCategory)
      : 'all',
    from: readDay(params, 'from'),
    to: readDay(params, 'to'),
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  }
}

/** Varsayılan değerler adrese yazılmaz: filtresiz sayfa yalnızca `/records`. */
export function writeRecordsFilters(filters: RecordsFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.category !== 'all') params.set('cat', filters.category)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.page > 1) params.set('page', String(filters.page))
  return params
}

/**
 * "2026-11-14" -> o yerel günün başı (ya da sonu) ISO olarak. Saat dilimi bilgisi tarihin içinde
 * gider, backend'in tahmin etmesi gerekmez.
 */
function dayBoundary(day: string, end: boolean): string {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number)
  const boundary = end
    ? new Date(year, month - 1, date, 23, 59, 59, 999)
    : new Date(year, month - 1, date)
  return boundary.toISOString()
}

/** Grafikler yalnızca tarih aralığına bağlı (`GET /events/stats` başka filtre almaz). */
export function toStatsRange({ from, to }: DayRange): EventStatsRange {
  return {
    ...(from ? { from: dayBoundary(from, false) } : {}),
    ...(to ? { to: dayBoundary(to, true) } : {}),
  }
}

/**
 * Ekrandaki filtreler -> `GET /events` parametreleri. Backend `q`'yu yalnızca olay kodunda ve
 * kamera adı / kodunda arar; Türkçe tür adını bilmez. Arama bir tür adıysa ("baret") `type`
 * olarak gider (kategori seçiliyse onunla kesişimi). Kesişim boşsa `q` olduğu gibi gider: backend
 * kodlarda ve kamera adlarında bulamaz, sonuç doğru olarak boş çıkar.
 */
export function toEventFilters(filters: RecordsFilters): EventFilters {
  const q = filters.q.trim()
  const categoryTypes = filters.category === 'all' ? null : eventCategoryTypes(filters.category)
  const page = { limit: RECORDS_PAGE_SIZE, offset: (filters.page - 1) * RECORDS_PAGE_SIZE }

  const queryTypes = eventTypesMatching(q).filter(
    (t) => !categoryTypes || categoryTypes.includes(t),
  )
  if (queryTypes.length > 0) return { ...toStatsRange(filters), type: queryTypes, ...page }

  return {
    ...toStatsRange(filters),
    ...(q ? { q } : {}),
    ...(categoryTypes ? { type: categoryTypes } : {}),
    ...page,
  }
}

/**
 * Aralık yalnızca verilen günü (YYYY-MM-DD) mi kapsıyor? Bitiş boşsa ve başlangıç o günse de
 * evet: seçilebilecek son gün bugün.
 */
export function isOnlyDay({ from, to }: DayRange, day: string): boolean {
  return from === day && (!to || to === day)
}
