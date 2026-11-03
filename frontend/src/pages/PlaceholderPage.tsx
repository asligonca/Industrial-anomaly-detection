/** Henüz kodlanmamış ekranlar için yer tutucu. İlgili FE ticket'ı bunu gerçek sayfayla değiştirir. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section>
      <h1 className="text-[28px] font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-zinc-500">Bu ekran henüz hazır değil.</p>
    </section>
  )
}
