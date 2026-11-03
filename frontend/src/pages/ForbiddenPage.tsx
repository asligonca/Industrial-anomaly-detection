import { Link } from 'react-router-dom'

/** Rolü yetmeyen kullanıcı yönetici sayfasına girerse gösterilir (HTTP 403 karşılığı). */
export function ForbiddenPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Yetkiniz bulunmamaktadır</h1>
      <p className="mt-2 text-zinc-600">Bu sayfayı yalnızca yöneticiler görüntüleyebilir.</p>
      <Link to="/" className="mt-4 inline-block underline">
        Ana sayfaya dön
      </Link>
    </main>
  )
}
