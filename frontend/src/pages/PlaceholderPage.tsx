import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

/** Henüz kodlanmamış ekranlar için yer tutucu. İlgili FE ticket'ı bunu gerçek sayfayla değiştirir. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={title} />
      <EmptyState title="Bu ekran henüz hazır değil" />
    </section>
  )
}
