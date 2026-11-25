import { roles } from '@/lib/labels'
import type { Role, User } from '@/types'
import { http, HttpResponse } from 'msw'
import { addAuditLog, db, nextId } from '../db'
import {
  apiPath,
  authed,
  errorResponse,
  invalidBody,
  nonEmptyString,
  paginate,
  readJsonObject,
  readPage,
  sameUsername,
} from '../utils'

/** Backend kuralı (madde 28). */
const MIN_PASSWORD_LENGTH = 8

export const userHandlers = [
  http.get(
    apiPath('/users'),
    authed(({ request }) => {
      const page = readPage(new URL(request.url).searchParams)
      if (page instanceof Response) return page
      return HttpResponse.json(paginate(db.users, page))
    }, 'admin'),
  ),

  http.post(
    apiPath('/users'),
    authed(async ({ request, user }) => {
      const body = await readJsonObject(request)
      if (!body) return invalidBody()
      const username = nonEmptyString(body.username)
      if (!username) return errorResponse(422, 'username is required')
      if (typeof body.password !== 'string' || body.password.length < MIN_PASSWORD_LENGTH) {
        return errorResponse(422, `password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      }
      if (!roles.includes(body.role as Role)) {
        return errorResponse(422, `role must be one of: ${roles.join(', ')}`)
      }
      // Kullanıcı adı büyük/küçük harfe duyarsız tekil: "Admin" ile "admin" aynı kişi (madde 31).
      if (db.users.some((u) => sameUsername(u.username, username))) {
        return errorResponse(409, 'Bu kullanıcı adı zaten kullanılıyor')
      }

      const created: User = {
        id: nextId(db.users),
        username,
        role: body.role as Role,
        is_active: true,
        created_at: new Date().toISOString(),
        last_login_at: null,
      }
      db.users.push(created)
      // Yeni kullanıcı mock'ta gerçekten giriş yapabilsin. Gerçek API parolayı yalnızca hash'ler.
      db.passwords[username] = body.password
      addAuditLog(user, 'user.created', { type: 'user', id: created.id }, { label: username })
      return HttpResponse.json(created, { status: 201 })
    }, 'admin'),
  ),
]
