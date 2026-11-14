import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getAuditLogs } from '../auditLogs'
import type { PageQuery } from '../pageQuery'
import { queryKeys } from '../queryKeys'

export function useAuditLogs(page: PageQuery) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(page),
    queryFn: ({ signal }) => getAuditLogs(page, signal),
    placeholderData: keepPreviousData,
  })
}
