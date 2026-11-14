import { canChangeStatus, severityRank } from '@/lib/eventRules'
import { cameraCode, eventStatuses, eventTypes, severities } from '@/lib/labels'
import type {
  AnomalyEvent,
  EventDetail,
  EventSortField,
  EventStatus,
  EventType,
  Severity,
} from '@/types'
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

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
/** Mock'taki tüm tespitler aynı modelden geliyor sayılır. */
const MODEL_VERSION = 'yolo26n-exp1'

/** "2026-11-03" gibi yalnızca-tarih değerlerde `to` o günün sonunu kapsar. */
function parseDate(value: string, endOfDay: boolean): Date | null {
  const date = new Date(
    DATE_ONLY.test(value) ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}` : value,
  )
  return Number.isNaN(date.getTime()) ? null : date
}

/** `from`/`to` çözülmüş hali; null = o yönde sınır yok. */
interface DateBounds {
  from: Date | null
  to: Date | null
}

/** `from`/`to` parametreleri: geçersizse 422. Liste ve istatistik aynı kuralı kullanır. */
function readDateBounds(params: URLSearchParams): DateBounds | Response {
  const rawFrom = params.get('from')
  const rawTo = params.get('to')
  const from = rawFrom === null ? null : parseDate(rawFrom, false)
  const to = rawTo === null ? null : parseDate(rawTo, true)
  if ((rawFrom !== null && !from) || (rawTo !== null && !to)) {
    return errorResponse(422, 'from/to must be an ISO date')
  }
  return { from, to }
}

const inRange =
  ({ from, to }: DateBounds) =>
  (e: EventRow) =>
    (!from || new Date(e.created_at) >= from) && (!to || new Date(e.created_at) <= to)

const normalize = (text: string) => text.toLocaleLowerCase('tr-TR')

/**
 * `?q=` araması, backend kararıyla aynı: olay kodu (OLY-014 ya da 14), kamera adı ve kamera kodu.
 * Türkçe tür adları backend'de yok; arayüz onları `type` parametresine çevirir (`recordsFilters`).
 */
function matchesQuery(event: EventRow, query: string): boolean {
  const haystack = [
    event.code,
    String(event.id),
    cameraCode(event.camera_id),
    cameraNameOf(event.camera_id),
  ]
  return haystack.some((text) => normalize(text).includes(query))
}

/** Yoldaki id: tam sayı değilse 422, olay yoksa 404. */
function findEvent(rawId: string): EventRow | Response {
  if (!/^\d+$/.test(rawId)) return errorResponse(422, 'id must be an integer')
  return db.events.find((e) => e.id === Number(rawId)) ?? errorResponse(404, 'Event not found')
}

/** Liste öğesi: satır + kamera özeti (backend `selectinload` ile ekler). */
function toEventResponse(row: EventRow): AnomalyEvent {
  return {
    ...row,
    camera: {
      id: row.camera_id,
      name: cameraNameOf(row.camera_id),
      area: findCamera(row.camera_id)?.area ?? '',
    },
  }
}

/** Detay: liste öğesi + bölge, model sürümü ve durum geçmişi (eskiden yeniye). */
function toDetail(row: EventRow): EventDetail {
  const zone = db.zones.find((z) => z.id === row.zone_id)
  return {
    ...toEventResponse(row),
    zone: zone ? { id: zone.id, name: zone.name } : null,
    model_version: MODEL_VERSION,
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

      const cameraId = params.get('camera_id')
      if (cameraId !== null && !/^\d+$/.test(cameraId)) {
        return errorResponse(422, 'camera_id must be an integer')
      }
      // ?type=no_helmet&type=no_vest -> ikisi de
      const types = params.getAll('type')
      if (types.some((t) => !eventTypes.includes(t as EventType))) {
        return errorResponse(422, `type must be one of: ${eventTypes.join(', ')}`)
      }
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
      const query = normalize(params.get('q')?.trim() ?? '')
      const areaOf = (e: EventRow) => findCamera(e.camera_id)?.area

      const filtered = db.events
        .filter((e) => cameraId === null || e.camera_id === Number(cameraId))
        .filter((e) => types.length === 0 || types.includes(e.type))
        .filter((e) => statuses.length === 0 || statuses.includes(e.status))
        .filter((e) => levels.length === 0 || levels.includes(e.severity))
        .filter((e) => area === null || areaOf(e) === area)
        .filter(inRange(bounds))
        .filter((e) => !query || matchesQuery(e, query))
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
      const event = findEvent(params.id)
      if (event instanceof Response) return event

      const body = await readJsonObject(request)
      if (!body) return invalidBody()
      if (!eventStatuses.includes(body.status as EventStatus)) {
        return errorResponse(422, `status must be one of: ${eventStatuses.join(', ')}`)
      }
      const status = body.status as EventStatus
      // Backend kuralı: izin verilmeyen geçiş (aynı duruma geçiş dahil) 409.
      if (!canChangeStatus(event.status, status)) {
        return errorResponse(409, `Cannot change status from ${event.status} to ${status}`)
      }
      const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null
      return HttpResponse.json(toEventResponse(setEventStatus(event, status, user, note)))
    }),
  ),
]
