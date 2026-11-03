import { Link } from 'react-router-dom'

/** Rolü yetmeyen kullanıcı yönetici sayfasına girerse gösterilir (HTTP 403 karşılığı). */
export function ForbiddenPage() {
  return (
    <section>
      <h1 className="text-[28px] font-bold tracking-tight">Yetkiniz bulunmamaktadır</h1>
      <p className="mt-2 text-zinc-500">Bu sayfayı yalnızca yöneticiler görüntüleyebilir.</p>
      <Link to="/" className="mt-4 inline-block underline">
        Ana sayfaya dön
      </Link>
    </section>
  )
}
