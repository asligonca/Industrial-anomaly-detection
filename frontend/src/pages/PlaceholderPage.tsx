import { Link } from 'react-router-dom'

/** Henüz kodlanmamış ekranlar için yer tutucu. İlgili FE ticket'ı bunu gerçek sayfayla değiştirir. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-zinc-600">Bu ekran henüz hazır değil.</p>
      <Link to="/" className="mt-4 inline-block underline">
        Ana sayfaya dön
      </Link>
    </main>
  )
}
