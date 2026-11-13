import { config } from '@/config'

/** Backend 2xx dışı yanıt döndürdüğünde fırlatılır. FastAPI'deki `detail` alanını taşır. */
export class ApiError extends Error {
  readonly status: number
  readonly detail: unknown

  constructor(status: number, message: string, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

type TokenProvider = () => string | null

let getToken: TokenProvider = () => null

/** Uygulama açılırken auth store burayı bağlar (bkz. features/auth/session.ts). */
export function setTokenProvider(provider: TokenProvider) {
  getToken = provider
}

/** `sentToken`: reddedilen isteğin gönderdiği token. Güncel oturumla karşılaştırmak için. */
type UnauthorizedHandler = (sentToken: string) => void

let onUnauthorized: UnauthorizedHandler = () => {}

/**
 * 401 yanıtında, istek bir token ile gitmişse çağrılır (oturumu kapatmak için).
 * `skipUnauthorizedHandler` isteklerde atlanır.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorized = handler
}

type QueryValue = string | number | boolean | null | undefined

/** Dizi değerler tekrarlı parametre olur: { status: ['a', 'b'] } -> ?status=a&status=b */
export type QueryParams = Record<string, QueryValue | QueryValue[]>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  /** JSON olarak gönderilir */
  json?: unknown
  /** application/x-www-form-urlencoded olarak gönderilir (OAuth2 login) */
  form?: Record<string, string>
  /** Boş (undefined/null/'') değerler URL'e eklenmez */
  query?: QueryParams
  signal?: AbortSignal
  /** true: 401 oturumu kapatmaz, yalnızca hata fırlatır (giriş isteği: yanlış parola 401 döner) */
  skipUnauthorizedHandler?: boolean
}

/** Sondaki "/" atılmış API taban adresi. Mock handler'ları da bunu kullanır. */
export const apiBaseUrl = () => config.apiUrl.replace(/\/$/, '')

/**
 * `<img>` gibi başlık gönderemeyen istekler için adrese `?token=<JWT>` ekler (WebSocket ile aynı
 * yöntem). Göreli adres API tabanına göre çözülür: '/api/events/14/snapshot' ya da tam adres.
 * Oturum yoksa adres token'sız döner (backend 401 verir, görüntü yüklenmez).
 */
export function withToken(url: string): string {
  const base = new URL(`${apiBaseUrl()}/`, window.location.href)
  const resolved = new URL(url, base)
  const token = getToken()
  if (token) resolved.searchParams.set('token', token)
  return resolved.href
}

function buildUrl(path: string, query?: QueryParams): string {
  const url = `${apiBaseUrl()}${path}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined && item !== null && item !== '') params.append(key, String(item))
    }
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

/** FastAPI hata gövdesinden okunabilir mesaj çıkarır. */
function messageFrom(status: number, detail: unknown): string {
  if (typeof detail === 'string') return detail
  // 422 doğrulama hatası: [{ loc, msg, type }, ...]
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((d: { msg?: string }) => d.msg ?? '').join(', ')
  }
  return `İstek başarısız (HTTP ${status})`
}

/** Tüm API istekleri buradan geçer: taban adres, token ve hata biçimi tek yerde. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', json, form, query, signal, skipUnauthorizedHandler } = options
  const headers = new Headers({ Accept: 'application/json' })
  let body: BodyInit | undefined

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(json)
  } else if (form) {
    headers.set('Content-Type', 'application/x-www-form-urlencoded')
    body = new URLSearchParams(form)
  }

  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), { method, headers, body, signal })
  } catch (err) {
    // İptal (sayfadan çıkma, sorgu değişimi) hata değildir; TanStack Query kendisi yönetir.
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    // Backend kapalı, ağ yok ya da CORS reddi: yanıt hiç gelmedi.
    throw new ApiError(0, 'Sunucuya ulaşılamadı', err)
  }

  if (!response.ok) {
    // Token yok/süresi dolmuş/geçersiz: oturumu kapat (giriş ekranına yönlendirme guard'dan gelir).
    if (response.status === 401 && token && !skipUnauthorizedHandler) onUnauthorized(token)
    const data = (await response.json().catch(() => null)) as { detail?: unknown } | null
    const detail = data?.detail
    throw new ApiError(response.status, messageFrom(response.status, detail), detail)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
