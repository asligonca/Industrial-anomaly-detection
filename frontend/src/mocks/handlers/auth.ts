import type { LoginResponse } from '@/types'
import { http, HttpResponse } from 'msw'
import { mockPasswords } from '../data/users'
import { addAuditLog, db } from '../db'
import {
  apiPath,
  createToken,
  errorResponse,
  invalidBody,
  networkDelay,
  readJsonObject,
} from '../utils'

/** Gövdeyi hem JSON hem form-encoded (FastAPI OAuth2 kalıbı) olarak okur. Okunamazsa null. */
async function readCredentials(request: Request) {
  if ((request.headers.get('Content-Type') ?? '').includes('application/json')) {
    const body = await readJsonObject(request)
    return body && { username: String(body.username ?? ''), password: String(body.password ?? '') }
  }
  const form = new URLSearchParams(await request.text())
  return { username: form.get('username') ?? '', password: form.get('password') ?? '' }
}

export const authHandlers = [
  http.post(apiPath('/auth/login'), async ({ request }) => {
    await networkDelay()
    const credentials = await readCredentials(request)
    if (!credentials) return invalidBody()

    const user = db.users.find(
      (u) =>
        u.username === credentials.username && mockPasswords[u.username] === credentials.password,
    )
    if (!user) return errorResponse(401, 'Incorrect username or password')

    user.last_login_at = new Date().toISOString()
    addAuditLog(user.username, 'Oturum açıldı')
    const body: LoginResponse = { access_token: createToken(user), token_type: 'bearer', user }
    return HttpResponse.json(body)
  }),
]
