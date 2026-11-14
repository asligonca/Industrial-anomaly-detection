import { LinkButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

export function NotFoundPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Sayfa bulunamadı" />
      <EmptyState
        title="Aradığınız adres yok ya da taşınmış"
        action={<LinkButton to="/">Ana sayfaya dön</LinkButton>}
      />
    </section>
  )
}
