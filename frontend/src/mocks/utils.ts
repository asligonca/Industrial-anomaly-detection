import { apiBaseUrl } from '@/api/client'
import type { Paginated, Role, User } from '@/types'
import { delay, HttpResponse, type DefaultBodyType, type PathParams, type StrictRequest } from 'msw'
import { db } from './db'

/** '/cameras' -> 'http://localhost:8000/api/cameras'. Handler'lar gerçek API adresini yakalar. */
export const apiPath = (path: string) => `${apiBaseUrl()}${path}`

/** Gerçek ağ gibi 200–400 ms gecikme. */
export const networkDelay = () => delay(200 + Math.floor(Math.random() * 200))

/** FastAPI hata gövdesi: { detail: "..." } */
export const errorResponse = (status: number, detail: string) =>
  HttpResponse.json({ detail }, { status })

export const unauthorized = () => errorResponse(401, 'Not authenticated')
export const forbidden = () => errorResponse(403, 'Not enough permissions')
export const invalidBody = () => errorResponse(422, 'Request body must be a valid JSON object')

/** Gövdeyi JSON nesnesi olarak okur; bozuk ya da nesne değilse null (çağıran 422 döner). */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json()
    return body !== null && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/** Boş olmayan metin ise kırpılmış hali, değilse null (zorunlu alan kontrolü). */
export function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/** Adres parametresindeki id tam sayı değilse 422 yanıtı, sayıysa sayı. */
export function parseId(raw: string): number | Response {
  return /^\d+$/.test(raw) ? Number(raw) : errorResponse(422, 'id must be an integer')
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function parseCount(value: string | null, fallback: number): number | null {
  if (value === null) return fallback
  return /^\d+$/.test(value) ? Number(value) : null
}

export interface PageParams {
  limit: number
  offset: number
}

/** `?limit=&offset=` okur (varsayılan 50 / 0). Geçersizse 422 yanıtı. */
export function readPage(params: URLSearchParams): PageParams | Response {
  const limit = parseCount(params.get('limit'), DEFAULT_LIMIT)
  const offset = parseCount(params.get('offset'), 0)
  if (limit === null || limit < 1 || limit > MAX_LIMIT || offset === null) {
    return errorResponse(422, `limit must be 1–${MAX_LIMIT} and offset must be >= 0`)
  }
  return { limit, offset }
}

/** Sayfalı liste yanıtı: `{ items, total, limit, offset }` (`total` filtrelenmiş toplam). */
export function paginate<T>(rows: T[], { limit, offset }: PageParams): Paginated<T> {
  return { items: rows.slice(offset, offset + limit), total: rows.length, limit, offset }
}

/** Backend gibi: yayın adresindeki parola yanıtta "***" olur, gerçeği API'den hiç dönmez. */
export function maskStreamPassword(url: string): string {
  return url.replace(/^([a-z][a-z0-9+.-]*:\/\/[^:@/]+):[^@/]*@/i, '$1:***@')
}

const TOKEN_PREFIX = 'mock.'
const TOKEN_TTL_MS = 60 * 60 * 1000

interface TokenPayload {
  sub: number
  role: Role
  exp: number
}

/** Sahte JWT: imzasız, yalnızca mock içindir. Rolü ve son kullanma zamanını taşır. */
export function createToken(user: User): string {
  const payload: TokenPayload = { sub: user.id, role: user.role, exp: Date.now() + TOKEN_TTL_MS }
  return TOKEN_PREFIX + btoa(JSON.stringify(payload))
}

/** Authorization: Bearer başlığından kullanıcıyı bulur. Geçersiz ya da süresi dolmuşsa null. */
export function authenticate(request: Request): User | null {
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token.startsWith(TOKEN_PREFIX)) return null
  try {
    const payload = JSON.parse(atob(token.slice(TOKEN_PREFIX.length))) as TokenPayload
    if (payload.exp < Date.now()) return null
    return db.users.find((u) => u.id === payload.sub) ?? null
  } catch {
    return null
  }
}

interface AuthedArgs<P extends PathParams> {
  request: StrictRequest<DefaultBodyType>
  params: P
  user: User
}

/**
 * Korumalı uç için ortak giriş: gecikme + Bearer kontrolü (401) + isteğe bağlı rol kontrolü (403).
 * Handler'lar yalnızca iş mantığını yazar.
 */
export function authed<P extends PathParams = PathParams>(
  resolver: (args: AuthedArgs<P>) => Response | Promise<Response>,
  requiredRole?: Role,
) {
  return async ({ request, params }: { request: StrictRequest<DefaultBodyType>; params: P }) => {
    await networkDelay()
    const user = authenticate(request)
    if (!user) return unauthorized()
    if (requiredRole && user.role !== requiredRole) return forbidden()
    return resolver({ request, params, user })
  }
}
