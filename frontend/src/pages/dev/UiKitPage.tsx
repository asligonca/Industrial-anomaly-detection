import { Badge, SeverityBadge, StatusBadge } from '@/components/ui/Badge'
import { Button, LinkButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBox } from '@/components/ui/ErrorBox'
import { FilterChips } from '@/components/ui/FilterChips'
import { Input } from '@/components/ui/Input'
import { inputClass } from '@/components/ui/inputStyles'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import type { EventStatus, Severity } from '@/types'
import { useState, type ReactNode } from 'react'

const severities: Severity[] = ['critical', 'high', 'medium', 'info']
const statuses: EventStatus[] = ['new', 'reviewing', 'confirmed', 'false_alarm']
const groupOptions = [
  { value: 'all', label: 'Tümü' },
  { value: 'production', label: 'Üretim' },
  { value: 'storage', label: 'Depo' },
]

function FilterChipsDemo() {
  const [value, setValue] = useState('all')
  return (
    <FilterChips label="Örnek filtre" options={groupOptions} value={value} onChange={setValue} />
  )
}

function PaginationDemo() {
  const [page, setPage] = useState(1)
  return <Pagination page={page} pageSize={20} total={57} onPageChange={setPage} />
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-600">{title}</h2>
      {children}
    </section>
  )
}

/**
 * Tasarım sistemi örnek sayfası. Yalnızca geliştirme ortamında `/dev/ui` adresinde açılır,
 * üretim derlemesine girmez (router'da `import.meta.env.DEV` ile korunur).
 */
export function UiKitPage() {
  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-10 px-6 py-10">
      <PageHeader
        title="Arayüz bileşenleri"
        description="Ortak bileşenlerin tüm durumları. Yeni ekran önce burada olanı kullanır."
        actions={<LinkButton to="/">Uygulamaya dön</LinkButton>}
      />

      <Block title="Düğme">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Birincil (lg)</Button>
          <Button size="md">Birincil (md)</Button>
          <Button size="sm">Birincil (sm)</Button>
          <Button disabled>Devre dışı</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="lg">
            İkincil (lg)
          </Button>
          <Button variant="secondary" size="md">
            İkincil (md)
          </Button>
          <Button variant="secondary" size="sm">
            İkincil (sm)
          </Button>
          <Button variant="secondary" disabled>
            Devre dışı
          </Button>
        </div>
      </Block>

      <Block title="Filtre (tek seçim)">
        <FilterChipsDemo />
      </Block>

      <Block title="Önem rozeti (sm / md / lg)">
        <div className="flex flex-wrap items-center gap-3">
          {severities.map((s) => (
            <SeverityBadge key={s} severity={s} size="sm" />
          ))}
          {severities.map((s) => (
            <SeverityBadge key={s} severity={s} />
          ))}
          {severities.map((s) => (
            <SeverityBadge key={s} severity={s} size="lg" />
          ))}
        </div>
      </Block>

      <Block title="Durum rozeti (hap / nokta)">
        <div className="flex flex-wrap items-center gap-3">
          {statuses.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-5">
          {statuses.map((s) => (
            <StatusBadge key={s} status={s} variant="dot" />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="bg-zinc-200 text-zinc-700">Özel renk</Badge>
        </div>
      </Block>

      <Block title="Kart">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="font-semibold">Kart (16 px)</p>
            <p className="mt-1 text-sm text-zinc-600">Liste ve ızgara öğeleri için.</p>
          </Card>
          <Card radius="panel" padding="lg">
            <p className="font-semibold">Panel (20 px)</p>
            <p className="mt-1 text-sm text-zinc-600">Giriş gibi tek başına duran yüzey.</p>
          </Card>
        </div>
      </Block>

      <Block title="Girdi">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Kullanıcı adı" defaultValue="operator1" />
          <Input label="Parola" type="password" error="Parola en az 4 karakter olmalı." />
        </div>
        {/* Etiketi görünmeyen alanlar (arama, not, tarih) `Input` yerine `inputClass` kullanır. */}
        <div className="flex flex-wrap items-center gap-3">
          <input aria-label="Örnek lg" placeholder="lg (Input)" className={inputClass('lg')} />
          <input aria-label="Örnek md" placeholder="md (arama, not)" className={inputClass('md')} />
          <input aria-label="Örnek sm" type="date" className={inputClass('sm', 'font-mono')} />
          <input
            aria-label="Örnek devre dışı"
            placeholder="Devre dışı"
            disabled
            className={inputClass('md')}
          />
        </div>
      </Block>

      <Block title="Sayfalama">
        <PaginationDemo />
      </Block>

      <Block title="Yükleniyor, hata, boş durum">
        <Card className="flex flex-col gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-32" />
        </Card>
        <ErrorBox message="Olaylar yüklenemedi." onRetry={() => undefined} />
        <EmptyState
          title="Açık olay yok"
          description="Yeni bir ihlal algılandığında burada görünür."
          action={<Button size="md">Tümünü göster</Button>}
        />
      </Block>
    </main>
  )
}
