import { eventStatuses, eventTypes } from '@/lib/labels'
import type { AnomalyEvent, EventStatus, EventType, Paginated } from '@/types'
import { http, HttpResponse } from 'msw'
import { eventStats } from '../data/stats'
import { db, setEventStatus } from '../db'
import { apiPath, authed, errorResponse, invalidBody, readJsonObject } from '../utils'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

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

export const eventHandlers = [
  http.get(
    apiPath('/events/stats'),
    // Tasarımdaki sabit değerler; from/to parametreleri mock'ta yok sayılır.
    authed(() => HttpResponse.json(eventStats)),
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
      const type = params.get('type')
      if (type !== null && !eventTypes.includes(type as EventType)) {
        return errorResponse(422, `type must be one of: ${eventTypes.join(', ')}`)
      }
      // ?status=new&status=reviewing -> ikisi de
      const statuses = params.getAll('status')
      if (statuses.some((s) => !eventStatuses.includes(s as EventStatus))) {
        return errorResponse(422, `status must be one of: ${eventStatuses.join(', ')}`)
      }
      const from = params.get('from') === null ? null : parseDate(params.get('from')!, false)
      const to = params.get('to') === null ? null : parseDate(params.get('to')!, true)
      if ((params.has('from') && !from) || (params.has('to') && !to)) {
        return errorResponse(422, 'from/to must be an ISO date')
      }

      const filtered = db.events
        .filter((e) => cameraId === null || e.camera_id === Number(cameraId))
        .filter((e) => type === null || e.type === type)
        .filter((e) => statuses.length === 0 || statuses.includes(e.status))
        .filter((e) => !from || new Date(e.created_at) >= from)
        .filter((e) => !to || new Date(e.created_at) <= to)
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

  http.patch<{ id: string }>(
    apiPath('/events/:id/status'),
    authed<{ id: string }>(async ({ request, params, user }) => {
      const event = db.events.find((e) => e.id === Number(params.id))
      if (!event) return errorResponse(404, 'Event not found')

      const body = await readJsonObject(request)
      if (!body) return invalidBody()
      if (!eventStatuses.includes(body.status as EventStatus)) {
        return errorResponse(422, `status must be one of: ${eventStatuses.join(', ')}`)
      }
      const note = typeof body.note === 'string' ? body.note : null
      return HttpResponse.json(setEventStatus(event, body.status as EventStatus, user, note))
    }),
  ),
]
