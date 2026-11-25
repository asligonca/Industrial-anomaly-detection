import { cameraCode } from '@/lib/labels'
import type { Camera } from '@/types'
import { http, HttpResponse } from 'msw'
import { addAuditLog, db, nextId } from '../db'
import {
  apiPath,
  authed,
  errorResponse,
  fieldError,
  invalidBody,
  maskStreamPassword,
  nonEmptyString,
  paginate,
  parseId,
  readJsonObject,
  readPage,
} from '../utils'

/** Formda zorunlu metin alanları (`location` boş olabilir). */
const requiredTextFields = ['name', 'area', 'stream_url'] as const

/** Backend gibi: maskeli adres (`***`) yeni adres olarak kaydedilemez. */
const MASK = '***'
const maskedUrlError = (value: string) =>
  fieldError(
    'stream_url',
    'Adres maskeli parola (***) içeriyor; gerçek parolayı girin',
    'masked_stream_url',
    value,
  )

type EditableField = (typeof requiredTextFields)[number] | 'location' | 'is_active'

/** Backend gibi: boş konum `null` olarak saklanır. */
const optionalText = (value: string) => value.trim() || null

/** Yanıt: parola maskeli. `db` gerçek adresi tutar (backend'in veritabanı gibi). */
const toResponse = (camera: Camera): Camera => ({
  ...camera,
  stream_url: camera.stream_url && maskStreamPassword(camera.stream_url),
})

export const cameraHandlers = [
  http.get(
    apiPath('/cameras'),
    authed(({ request }) => {
      const page = readPage(new URL(request.url).searchParams)
      if (page instanceof Response) return page
      return HttpResponse.json(paginate(db.cameras.map(toResponse), page))
    }),
  ),

  http.post(
    apiPath('/cameras'),
    authed(async ({ request, user }) => {
      const body = await readJsonObject(request)
      if (!body) return invalidBody()
      const name = nonEmptyString(body.name)
      const area = nonEmptyString(body.area)
      const streamUrl = nonEmptyString(body.stream_url)
      if (!name || !area || !streamUrl) {
        return errorResponse(422, 'name, area and stream_url are required')
      }
      if (streamUrl.includes(MASK)) return maskedUrlError(streamUrl)
      const id = nextId(db.cameras)
      const camera: Camera = {
        id,
        code: cameraCode(id),
        name,
        location: typeof body.location === 'string' ? optionalText(body.location) : null,
        stream_url: streamUrl,
        is_active: typeof body.is_active === 'boolean' ? body.is_active : true,
        area,
        created_at: new Date().toISOString(),
      }
      db.cameras.push(camera)
      addAuditLog(user, 'camera.created', { type: 'camera', id }, { label: camera.code })
      return HttpResponse.json(toResponse(camera), { status: 201 })
    }, 'admin'),
  ),

  http.patch<{ id: string }>(
    apiPath('/cameras/:id'),
    authed<{ id: string }>(async ({ request, params, user }) => {
      const id = parseId(params.id)
      if (id instanceof Response) return id
      const camera = db.cameras.find((c) => c.id === id)
      if (!camera) return errorResponse(404, 'Kamera bulunamadı')

      const body = await readJsonObject(request)
      if (!body) return invalidBody()
      if ('is_active' in body && typeof body.is_active !== 'boolean') {
        return errorResponse(422, 'is_active must be a boolean')
      }
      for (const field of requiredTextFields) {
        if (field in body && !nonEmptyString(body[field])) {
          return errorResponse(422, `${field} must be a non-empty string`)
        }
      }

      // Gönderilmeyen alan (stream_url dahil) korunur. Backend gibi: yalnızca gerçekten değişen
      // alanlar yazılır; maskeli adres aynen geri gelirse adres değişmemiş sayılır.
      const changes: Partial<Pick<Camera, EditableField>> = {}
      for (const field of requiredTextFields) {
        const value = nonEmptyString(body[field])
        if (value) changes[field] = value
      }
      const newUrl = changes.stream_url
      if (newUrl) {
        if (newUrl === maskStreamPassword(camera.stream_url ?? '')) delete changes.stream_url
        else if (newUrl.includes(MASK)) return maskedUrlError(newUrl)
      }
      if (typeof body.location === 'string') changes.location = optionalText(body.location)
      if (body.location === null) changes.location = null
      if (typeof body.is_active === 'boolean') changes.is_active = body.is_active

      const changed = (Object.keys(changes) as EditableField[]).filter(
        (field) => camera[field] !== changes[field],
      )
      Object.assign(camera, Object.fromEntries(changed.map((field) => [field, changes[field]])))

      // Denetim kaydı yalnızca gerçek değişiklikte: aktiflik ve diğer alanlar ayrı kayıt.
      const target = { type: 'camera', id } as const
      const details = { label: camera.code }
      if (changed.includes('is_active')) {
        addAuditLog(
          user,
          camera.is_active ? 'camera.activated' : 'camera.deactivated',
          target,
          details,
        )
      }
      if (changed.some((field) => field !== 'is_active')) {
        addAuditLog(user, 'camera.updated', target, details)
      }
      return HttpResponse.json(toResponse(camera))
    }, 'admin'),
  ),
]
