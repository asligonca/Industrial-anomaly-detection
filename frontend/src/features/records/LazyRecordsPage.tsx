import { lazy, Suspense } from 'react'

// Grafik kütüphanesi (Recharts) yalnızca Kayıtlar açılınca indirilir. Router'ın `lazy`'si yerine
// React.lazy: sayfa doğrudan açılınca da üst bar hemen görünür, yalnızca içerik bekler.
const RecordsPage = lazy(async () => ({
  default: (await import('./RecordsPage')).RecordsPage,
}))

/** Kayıtlar sayfası, kodu ilk açılışta ayrıca indirilir. */
export function LazyRecordsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Yükleniyor…</p>}>
      <RecordsPage />
    </Suspense>
  )
}
