import { canChangeStatus, severityRank } from '@/lib/eventRules'
import { eventStatuses, severities } from '@/lib/labels'
import type { AnomalyEvent, EventDetail, EventSortField, EventStatus, Severity } from '@/types'
import { http, HttpResponse } from 'msw'
import { buildEventAnalysis } from '../analysis'
import { cameraNameOf, db, findCamera, setEventStatus } from '../db'
import type { EventRow } from '../rows'
import { buildEventStats } from '../stats'
import {
  apiPath,
  authed,
  errorResponse,
  invalidBody,
  paginate,
  readJsonObject,
  readPage,
} from '../utils'

/** Mock'taki tüm tespitler aynı modelden geliyor sayılır. */
const MODEL_VERSION = 'yolo26n-exp1'

/** Backend notu en fazla 500 karakter kabul eder. */
const NOTE_MAX_LENGTH = 500

/** Saat dilimli ISO tarih-saat: sonu `Z` ya da `+03:00` gibi. Yalnızca tarih kabul edilmez. */
const AWARE_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/i

/** Saat dilimli değilse ya da geçersizse null. */
function parseDate(value: string): Date | null {
  if (!AWARE_DATETIME.test(value)) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** `from`/`to` çözülmüş hali; null = o yönde sınır yok. */
interface DateBounds {
  from: Date | null
  to: Date | null
}

/**
 * `from`/`to` parametreleri, backend kuralı: saat dilimli ISO tarih-saat zorunlu (yalnızca tarih ya
 * da saat dilimsiz değer 422), `to` dahil, `from > to` 422. Liste ve istatistik aynı kuralı kullanır.
 */
function readDateBounds(params: URLSearchParams): DateBounds | Response {
  const rawFrom = params.get('from')
  const rawTo = params.get('to')
  const from = rawFrom === null ? null : parseDate(rawFrom)
  const to = rawTo === null ? null : parseDate(rawTo)
  if ((rawFrom !== null && !from) || (rawTo !== null && !to)) {
    return errorResponse(422, 'from/to saat dilimli ISO tarih-saat olmalı')
  }
  if (from && to && from > to) return errorResponse(422, "`from`, `to`'dan sonra olamaz")
  return { from, to }
}

const inRange =
  ({ from, to }: DateBounds) =>
  (e: EventRow) =>
    (!from || new Date(e.created_at) >= from) && (!to || new Date(e.created_at) <= to)

/** Türkçe kurallarıyla küçük harf (I -> ı, İ -> i). */
const fold = (text: string) => text.toLocaleLowerCase('tr-TR')

const EVENT_CODE = /^(?:oly-?)?0*(\d+)$/i
const CAMERA_CODE = /^kam-?0*(\d+)$/i

/**
 * `?q=` araması, backend ile aynı: olay kodu tam eşleşme (`14`, `014`, `OLY-014` yalnızca 14'ü
 * bulur), kamera kodu tam eşleşme (`KAM-03`), kamera adında Türkçe harfe duyarsız alt dizgi.
 * Türkçe tür adları backend'de yok; arayüz onları `type` parametresine çevirir (`recordsFilters`).
 */
function queryMatcher(raw: string): ((event: EventRow) => boolean) | null {
  const query = raw.trim()
  if (!query) return null
  const eventId = EVENT_CODE.exec(query)?.[1]
  const cameraIds = new Set<number>()
  const cameraId = CAMERA_CODE.exec(query)?.[1]
  if (cameraId) cameraIds.add(Number(cameraId))
  const needle = fold(query)
  for (const camera of db.cameras) {
    if (fold(camera.name).includes(needle)) cameraIds.add(camera.id)
  }
  return (event) =>
    (eventId !== undefined && event.id === Number(eventId)) || cameraIds.has(event.camera_id)
}

/** Yoldaki id: tam sayı değilse 422, olay yoksa 404. */
function findEvent(rawId: string): EventRow | Response {
  if (!/^\d+$/.test(rawId)) return errorResponse(422, 'id must be an integer')
  return db.events.find((e) => e.id === Number(rawId)) ?? errorResponse(404, 'Olay bulunamadı')
}

/** Liste öğesi: satır + kamera ve bölge özeti, model sürümü (backend `selectinload` ile ekler). */
function toEventResponse(row: EventRow): AnomalyEvent {
  const zone = db.zones.find((z) => z.id === row.zone_id)
  return {
    ...row,
    camera: {
      id: row.camera_id,
      name: cameraNameOf(row.camera_id),
      area: findCamera(row.camera_id)?.area ?? '',
    },
    zone: zone ? { id: zone.id, name: zone.name } : null,
    model_version: MODEL_VERSION,
  }
}

/** Detay: liste öğesi + durum geçmişi (eskiden yeniye). */
function toDetail(row: EventRow): EventDetail {
  return {
    ...toEventResponse(row),
    actions: db.alarmActions
      .filter((a) => a.event_id === row.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }
}

const sortKeys: Record<EventSortField, (e: EventRow) => number> = {
  created_at: (e) => new Date(e.created_at).getTime(),
  severity: (e) => severityRank[e.severity],
  confidence: (e) => e.confidence,
}

const sortFields = Object.keys(sortKeys) as EventSortField[]

interface SortOrder {
  field: EventSortField
  descending: boolean
}

/** "-severity" -> { field: 'severity', descending: true }; geçersizse null. */
function parseSort(raw: string): SortOrder | null {
  const descending = raw.startsWith('-')
  const field = (descending ? raw.slice(1) : raw) as EventSortField
  return sortFields.includes(field) ? { field, descending } : null
}

/** Başında `-` azalan. Eşitlikte en yeni önce. */
function compareBy({ field, descending }: SortOrder) {
  const key = sortKeys[field]
  const byDate = sortKeys.created_at
  return (a: EventRow, b: EventRow) =>
    (descending ? key(b) - key(a) : key(a) - key(b)) || byDate(b) - byDate(a)
}

// Sıra önemli: '/events/stats', '/events/:id'den önce gelmeli ("stats" id sanılmasın).
export const eventHandlers = [
  http.get(
    apiPath('/events/stats'),
    authed(({ request }) => {
      const bounds = readDateBounds(new URL(request.url).searchParams)
      if (bounds instanceof Response) return bounds
      return HttpResponse.json(buildEventStats(db.events.filter(inRange(bounds))))
    }),
  ),

  http.get(
    apiPath('/events'),
    authed(({ request }) => {
      const params = new URL(request.url).searchParams
      const page = readPage(params)
      if (page instanceof Response) return page

      // ?camera_id=1&camera_id=3 -> ikisi de (zone_id da aynı)
      const cameraIds = params.getAll('camera_id')
      const zoneIds = params.getAll('zone_id')
      if ([...cameraIds, ...zoneIds].some((id) => !/^\d+$/.test(id))) {
        return errorResponse(422, 'camera_id ve zone_id tam sayı olmalı')
      }
      // ?type=no_helmet&type=no_vest -> ikisi de. Backend gibi bilinmeyen tür 422 vermez,
      // hiçbir olayla eşleşmez.
      const types = params.getAll('type')
      // ?status=new&status=reviewing -> ikisi de
      const statuses = params.getAll('status')
      if (statuses.some((s) => !eventStatuses.includes(s as EventStatus))) {
        return errorResponse(422, `status must be one of: ${eventStatuses.join(', ')}`)
      }
      // ?severity=high&severity=critical -> ikisi de
      const levels = params.getAll('severity')
      if (levels.some((v) => !severities.includes(v as Severity))) {
        return errorResponse(422, `severity must be one of: ${severities.join(', ')}`)
      }
      const area = params.get('area')
      const sort = parseSort(params.get('sort') ?? '-created_at')
      if (!sort) {
        const allowed = sortFields.flatMap((f) => [f, `-${f}`]).join(', ')
        return errorResponse(422, `sort must be one of: ${allowed}`)
      }
      const bounds = readDateBounds(params)
      if (bounds instanceof Response) return bounds
      const matchesQuery = queryMatcher(params.get('q') ?? '')
      const areaOf = (e: EventRow) => findCamera(e.camera_id)?.area

      const filtered = db.events
        .filter((e) => cameraIds.length === 0 || cameraIds.includes(String(e.camera_id)))
        .filter((e) => zoneIds.length === 0 || zoneIds.includes(String(e.zone_id)))
        .filter((e) => types.length === 0 || types.includes(e.type))
        .filter((e) => statuses.length === 0 || statuses.includes(e.status))
        .filter((e) => levels.length === 0 || levels.includes(e.severity))
        .filter((e) => area === null || areaOf(e) === area)
        .filter(inRange(bounds))
        .filter((e) => !matchesQuery || matchesQuery(e))
        .sort(compareBy(sort))

      const result = paginate(filtered, page)
      return HttpResponse.json({ ...result, items: result.items.map(toEventResponse) })
    }),
  ),

  http.get<{ id: string }>(
    apiPath('/events/:id'),
    authed<{ id: string }>(({ params }) => {
      const event = findEvent(params.id)
      return event instanceof Response ? event : HttpResponse.json(toDetail(event))
    }),
  ),

  http.get<{ id: string }>(
    apiPath('/events/:id/analysis'),
    authed<{ id: string }>(({ params }) => {
      const event = findEvent(params.id)
      return event instanceof Response ? event : HttpResponse.json(buildEventAnalysis(event))
    }),
  ),

  http.patch<{ id: string }>(
    apiPath('/events/:id/status'),
    authed<{ id: string }>(async ({ request, params, user }) => {
      // Backend gibi gövde önce doğrulanır: olmayan olaya geçersiz gövde 404 değil 422.
      const body = await readJsonObject(request)
      if (!body) return invalidBody()
      if (!eventStatuses.includes(body.status as EventStatus)) {
        return errorResponse(422, `status şunlardan biri olmalı: ${eventStatuses.join(', ')}`)
      }
      if (body.note !== undefined && body.note !== null && typeof body.note !== 'string') {
        return errorResponse(422, 'note metin olmalı')
      }
      if (typeof body.note === 'string' && body.note.length > NOTE_MAX_LENGTH) {
        return errorResponse(422, `Not en fazla ${NOTE_MAX_LENGTH} karakter olabilir`)
      }
      const status = body.status as EventStatus
      // Not kırpılır; boşsa null.
      const note = typeof body.note === 'string' ? body.note.trim() || null : null

      const event = findEvent(params.id)
      if (event instanceof Response) return event
      // Backend kuralı: izin verilmeyen geçiş (aynı duruma geçiş dahil) 409.
      if (!canChangeStatus(event.status, status)) {
        return errorResponse(409, `Olay durumu ${event.status} → ${status} olarak değiştirilemez`)
      }
      // Yanıt güncel olay detayı (`GET /events/{id}` ile aynı, `actions` dahil).
      return HttpResponse.json(toDetail(setEventStatus(event, status, user, note)))
    }),
  ),
]
