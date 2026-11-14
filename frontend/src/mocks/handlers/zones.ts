import { ruleTypes } from '@/lib/labels'
import type { Point, RuleType, Zone } from '@/types'
import { http, HttpResponse } from 'msw'
import { addAuditLog, db, nextId } from '../db'
import {
  apiPath,
  authed,
  errorResponse,
  invalidBody,
  nonEmptyString,
  parseId,
  readJsonObject,
} from '../utils'

/** En az 3 köşe, her köşe görüntüye göre 0–1 arası [x, y] (backend-notlari madde 9). */
function parsePolygon(value: unknown): Point[] | null {
  if (!Array.isArray(value) || value.length < 3) return null
  const inRange = (n: unknown) => typeof n === 'number' && n >= 0 && n <= 1
  const ok = value.every(
    (p: unknown) => Array.isArray(p) && p.length === 2 && inRange(p[0]) && inRange(p[1]),
  )
  return ok ? (value as Point[]) : null
}

export const zoneHandlers = [
  http.get(
    apiPath('/zones'),
    // Silinen (pasif) bölgeler listede yok; olay detayı yine adını bulur.
    authed(() => HttpResponse.json(db.zones.filter((zone) => zone.is_active))),
  ),

  http.post(
    apiPath('/zones'),
    authed(async ({ request, user }) => {
      const body = await readJsonObject(request)
      if (!body) return invalidBody()
      const name = nonEmptyString(body.name)
      if (!name) return errorResponse(422, 'name is required')
      const camera = db.cameras.find((c) => c.id === body.camera_id)
      if (!camera) return errorResponse(422, 'camera_id must be an existing camera')
      if (!ruleTypes.includes(body.rule_type as RuleType)) {
        return errorResponse(422, `rule_type must be one of: ${ruleTypes.join(', ')}`)
      }
      const polygon = parsePolygon(body.polygon)
      if (!polygon) return errorResponse(422, 'polygon must have at least 3 points in 0–1')

      const zone: Zone = {
        id: nextId(db.zones),
        camera_id: camera.id,
        name,
        polygon,
        rule_type: body.rule_type as RuleType,
        is_active: true,
      }
      db.zones.push(zone)
      addAuditLog(user, 'zone.created', { type: 'zone', id: zone.id }, { label: name })
      return HttpResponse.json(zone, { status: 201 })
    }, 'admin'),
  ),

  http.delete<{ id: string }>(
    apiPath('/zones/:id'),
    authed<{ id: string }>(({ params, user }) => {
      const id = parseId(params.id)
      if (id instanceof Response) return id
      const zone = db.zones.find((z) => z.id === id && z.is_active)
      if (!zone) return errorResponse(404, 'Zone not found')
      // Yumuşak silme: kayıt kalır, eski olaylar bölge adını korur.
      zone.is_active = false
      addAuditLog(user, 'zone.deactivated', { type: 'zone', id }, { label: zone.name })
      return new HttpResponse(null, { status: 204 })
    }, 'admin'),
  ),
]
