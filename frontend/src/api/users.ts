import type { Paginated, User, UserCreate } from '@/types'
import { apiRequest } from './client'
import type { PageQuery } from './pageQuery'

/** Yalnızca admin. Sayfalı: `{ items, total, limit, offset }`. */
export function getUsers(page: PageQuery, signal?: AbortSignal) {
  return apiRequest<Paginated<User>>('/users', { query: { ...page }, signal })
}

/** Yalnızca admin. Aynı kullanıcı adı varsa 409. */
export function createUser(user: UserCreate) {
  return apiRequest<User>('/users', { method: 'POST', json: user })
}
