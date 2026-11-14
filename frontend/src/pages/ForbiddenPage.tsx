import { LinkButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

/** Rolü yetmeyen kullanıcı yönetici sayfasına girerse gösterilir (HTTP 403 karşılığı). */
export function ForbiddenPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Yetkiniz bulunmamaktadır" />
      <EmptyState
        title="Bu sayfayı yalnızca yöneticiler görüntüleyebilir"
        action={<LinkButton to="/">Ana sayfaya dön</LinkButton>}
      />
    </section>
  )
}
