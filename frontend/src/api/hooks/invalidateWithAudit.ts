import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { queryKeys } from '../queryKeys'

/**
 * Yazma işleminden sonra değişen veriyi ve denetim kayıtlarını yeniler: backend her işlemi
 * denetim kaydına yazar, liste açıksa yeni satır hemen görünsün.
 */
export function invalidateWithAudit(queryClient: QueryClient, queryKey: QueryKey) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey }),
    queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs.all }),
  ])
}
