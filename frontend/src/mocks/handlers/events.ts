import {
  cameraCode,
  eventCode,
  eventStatuses,
  eventTypeLabels,
  eventTypeStatLabels,
  eventTypes,
} from '@/lib/labels'
import type { AnomalyEvent, EventDetail, EventStatus, EventType, Paginated } from '@/types'
import { http, HttpResponse } from 'msw'
import { buildEventAnalysis } from '../analysis'
import { db, setEventStatus } from '../db'
import { buildEventStats } from '../stats'
import { apiPath, authed, errorResponse, invalidBody, readJsonObject } from '../utils'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
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

/** Negatif olmayan tam sayı; parametre yoksa varsayılan, geçersizse null. */
function parseCount(value: string | null, fallback: number): number | null {
  if (value === null) return fallback
  return /^\d+$/.test(value) ? Number(value) : null
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
  (e: AnomalyEvent) =>
    (!from || new Date(e.created_at) >= from) && (!to || new Date(e.created_at) <= to)

const normalize = (text: string) => text.toLocaleLowerCase('tr-TR')

/**
 * `?q=` araması: olay no, kamera kodu/adı, tür kodu ya da Türkçe adı içinde geçiyorsa eşleşir.
 * (Gerçek backend'e öneri; Türkçe tür adlarını backend de bilmeli ya da frontend koda çevirmeli.)
 */
function matchesQuery(event: AnomalyEvent, query: string): boolean {
  const camera = db.cameras.find((c) => c.id === event.camera_id)
  const haystack = [
    eventCode(event.id),
    String(event.id),
    cameraCode(event.camera_id),
    camera?.name ?? '',
    event.type,
    eventTypeLabels[event.type],
    eventTypeStatLabels[event.type],
  ]
  return haystack.some((text) => normalize(text).includes(query))
}

/** Yoldaki id: tam sayı değilse 422, olay yoksa 404. */
function findEvent(rawId: string): AnomalyEvent | Response {
  if (!/^\d+$/.test(rawId)) return errorResponse(422, 'id must be an integer')
  return db.events.find((e) => e.id === Number(rawId)) ?? errorResponse(404, 'Event not found')
}

function toDetail(event: AnomalyEvent): EventDetail {
  const zone = db.zones.find((z) => z.id === event.zone_id)
  return {
    ...event,
    zone: zone ? { id: zone.id, name: zone.name } : null,
    model_version: MODEL_VERSION,
  }
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
      const limit = parseCount(params.get('limit'), DEFAULT_LIMIT)
      const offset = parseCount(params.get('offset'), 0)
      if (limit === null || limit < 1 || limit > MAX_LIMIT || offset === null) {
        return errorResponse(422, `limit must be 1–${MAX_LIMIT} and offset must be >= 0`)
      }

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
      const bounds = readDateBounds(params)
      if (bounds instanceof Response) return bounds
      const query = normalize(params.get('q')?.trim() ?? '')

      const filtered = db.events
        .filter((e) => cameraId === null || e.camera_id === Number(cameraId))
        .filter((e) => types.length === 0 || types.includes(e.type))
        .filter((e) => statuses.length === 0 || statuses.includes(e.status))
        .filter(inRange(bounds))
        .filter((e) => !query || matchesQuery(e, query))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))

      const body: Paginated<AnomalyEvent> = {
        items: filtered.slice(offset, offset + limit),
        total: filtered.length,
        limit,
        offset,
      }
      return HttpResponse.json(body)
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
      const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null
      return HttpResponse.json(setEventStatus(event, body.status as EventStatus, user, note))
    }),
  ),
]
