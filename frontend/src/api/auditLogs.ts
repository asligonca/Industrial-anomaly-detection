import type { AuditLog, Paginated } from '@/types'
import { apiRequest } from './client'
import type { PageQuery } from './pageQuery'

/** Yalnızca admin. En yeni kayıt başta, sayfalı. */
export function getAuditLogs(page: PageQuery, signal?: AbortSignal) {
  return apiRequest<Paginated<AuditLog>>('/audit-logs', { query: { ...page }, signal })
}
