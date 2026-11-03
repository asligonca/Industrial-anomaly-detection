import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section>
      <h1 className="text-[28px] font-bold tracking-tight">Sayfa bulunamadı</h1>
      <Link to="/" className="mt-4 inline-block underline">
        Ana sayfaya dön
      </Link>
    </section>
  )
}
