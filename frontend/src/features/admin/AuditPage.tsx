import { useAuditLogs } from '@/api/hooks/useAuditLogs'
import { pageQuery } from '@/api/pageQuery'
import { ErrorBox } from '@/components/ui/ErrorBox'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { auditLogText, auditLogUser } from '@/lib/auditText'
import { formatRelativeDayTime } from '@/lib/format'
import { useState } from 'react'
import {
  ADMIN_PAGE_SIZE,
  adminEmptyClass,
  adminListClass,
  adminRowClass,
  SKELETON_ROWS,
} from './adminStyles'

/**
 * Yönetici: denetim kayıtları, en yenisi başta, sayfalı. Kayıtları backend kod olarak yazar
 * (`camera.activated`); Türkçe cümleyi `auditLogText` üretir. Bu ekran yalnızca okur.
 */
export function AuditPage() {
  const [page, setPage] = useState(1)
  const logs = useAuditLogs(pageQuery(page, ADMIN_PAGE_SIZE))
  const now = new Date()

  return (
    <section className="flex max-w-[960px] flex-col gap-4">
      <PageHeader title="Denetim kayıtları" />

      {logs.isError ? (
        <ErrorBox message="Denetim kayıtları yüklenemedi." onRetry={() => void logs.refetch()} />
      ) : (
        <ol aria-busy={logs.isPending || logs.isPlaceholderData} className={adminListClass}>
          {logs.data === undefined ? (
            Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <li key={i} className={adminRowClass()}>
                <Skeleton className="h-5" />
              </li>
            ))
          ) : logs.data.items.length === 0 ? (
            <li className={adminEmptyClass}>Kayıt yok</li>
          ) : (
            logs.data.items.map((log) => (
              <li
                key={log.id}
                className={adminRowClass(
                  'grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-0.5 sm:grid-cols-[150px_120px_minmax(0,1fr)]',
                )}
              >
                <time
                  dateTime={log.created_at}
                  className="font-mono text-[13px] whitespace-nowrap text-zinc-500"
                >
                  {formatRelativeDayTime(new Date(log.created_at), now)}
                </time>
                <span className="truncate text-zinc-500">{auditLogUser(log)}</span>
                <span className="col-span-2 sm:col-span-1">{auditLogText(log)}</span>
              </li>
            ))
          )}
        </ol>
      )}

      {logs.data && logs.data.total > ADMIN_PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={ADMIN_PAGE_SIZE}
          total={logs.data.total}
          onPageChange={setPage}
          disabled={logs.isPlaceholderData}
        />
      )}
    </section>
  )
}
