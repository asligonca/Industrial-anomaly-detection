import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

/** Geçici ana ekran. Canlı izleme (FE-5) bunu değiştirecek. */
export function HomePage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Canlı izleme" />
      <EmptyState title="Bu ekran henüz hazır değil" />
    </section>
  )
}
