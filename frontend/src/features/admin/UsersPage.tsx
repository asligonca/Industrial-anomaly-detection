import { useUsers } from '@/api/hooks/useUsers'
import { pageQuery } from '@/api/pageQuery'
import { Button } from '@/components/ui/Button'
import { ErrorBox } from '@/components/ui/ErrorBox'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatRelativeDayTime } from '@/lib/format'
import { roleLabels } from '@/lib/labels'
import { useState } from 'react'
import {
  ADMIN_PAGE_SIZE,
  adminEmptyClass,
  adminListClass,
  adminRowClass,
  SKELETON_ROWS,
} from './adminStyles'
import { UserAddDialog } from './UserAddDialog'

/** Yönetici: kullanıcı listesi (ad, rol, son giriş) ve "Kullanıcı ekle". */
export function UsersPage() {
  const [page, setPage] = useState(1)
  const users = useUsers(pageQuery(page, ADMIN_PAGE_SIZE))
  const [adding, setAdding] = useState(false)
  const now = new Date()

  return (
    <section className="flex max-w-[960px] flex-col gap-4">
      <PageHeader
        title="Kullanıcılar"
        actions={
          <Button size="sm" onClick={() => setAdding(true)}>
            Kullanıcı ekle
          </Button>
        }
      />

      {users.isError ? (
        <ErrorBox message="Kullanıcılar yüklenemedi." onRetry={() => void users.refetch()} />
      ) : (
        <ul aria-busy={users.isPending || users.isPlaceholderData} className={adminListClass}>
          {users.data === undefined ? (
            Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <li key={i} className={adminRowClass('py-4')}>
                <Skeleton className="h-6" />
              </li>
            ))
          ) : users.data.items.length === 0 ? (
            <li className={adminEmptyClass}>Kayıtlı kullanıcı yok</li>
          ) : (
            users.data.items.map((user) => (
              <li
                key={user.id}
                className={adminRowClass(
                  'grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 py-4 sm:grid-cols-[1.2fr_1fr_1fr] sm:items-center',
                )}
              >
                <span className="truncate font-medium">{user.username}</span>
                <span className="text-right text-zinc-500 sm:text-left">
                  {roleLabels[user.role]}
                </span>
                <span className="col-span-2 text-[13px] text-zinc-500 sm:col-span-1">
                  {user.last_login_at ? (
                    <>
                      <span className="sr-only">Son giriş: </span>
                      <time dateTime={user.last_login_at}>
                        {formatRelativeDayTime(new Date(user.last_login_at), now)}
                      </time>
                    </>
                  ) : (
                    'Hiç giriş yapmadı'
                  )}
                </span>
              </li>
            ))
          )}
        </ul>
      )}

      {users.data && users.data.total > ADMIN_PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={ADMIN_PAGE_SIZE}
          total={users.data.total}
          onPageChange={setPage}
          disabled={users.isPlaceholderData}
        />
      )}

      <UserAddDialog open={adding} onClose={() => setAdding(false)} />
    </section>
  )
}
