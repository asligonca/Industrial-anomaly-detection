import { lazy, Suspense, type ReactNode } from 'react'

// Admin ekranları yalnızca admin açınca indirilir: operatörün ana paketi küçülür. `LazyRecordsPage`
// gibi React.lazy: sayfa doğrudan açılınca da üst bar hemen görünür, yalnızca içerik bekler.
const CamerasZonesPage = lazy(async () => ({
  default: (await import('./CamerasZonesPage')).CamerasZonesPage,
}))
const UsersPage = lazy(async () => ({ default: (await import('./UsersPage')).UsersPage }))
const AuditPage = lazy(async () => ({ default: (await import('./AuditPage')).AuditPage }))

function AdminSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Yükleniyor…</p>}>{children}</Suspense>
  )
}

export function LazyCamerasZonesPage() {
  return (
    <AdminSuspense>
      <CamerasZonesPage />
    </AdminSuspense>
  )
}

export function LazyUsersPage() {
  return (
    <AdminSuspense>
      <UsersPage />
    </AdminSuspense>
  )
}

export function LazyAuditPage() {
  return (
    <AdminSuspense>
      <AuditPage />
    </AdminSuspense>
  )
}
