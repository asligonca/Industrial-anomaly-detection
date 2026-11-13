import { useCameras } from '@/api/hooks/useCameras'
import { useEventStats } from '@/api/hooks/useEventStats'
import { useEvents } from '@/api/hooks/useEvents'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorBox } from '@/components/ui/ErrorBox'
import { FilterChips, type FilterOption } from '@/components/ui/FilterChips'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { toDateInputValue } from '@/lib/format'
import { eventCategories, eventCategoryLabels } from '@/lib/labels'
import { useMemo, useState } from 'react'
import { DateRangeFilter } from './DateRangeFilter'
import { HourlyChart } from './HourlyChart'
import { RecordsSearch } from './RecordsSearch'
import { RecordsTable } from './RecordsTable'
import { TypeDistribution } from './TypeDistribution'
import {
  RECORDS_PAGE_SIZE,
  isOnlyDay,
  toEventFilters,
  toStatsRange,
  type RecordsCategory,
} from './recordsFilters'
import { useRecordsFilters } from './useRecordsFilters'

const categoryOptions: FilterOption<RecordsCategory>[] = [
  { value: 'all', label: 'Tümü' },
  ...eventCategories.map((value) => ({ value, label: eventCategoryLabels[value] })),
]

/** Anomali kayıtları: saatlik grafik, türe göre dağılım ve tüm olayların aranabilir tablosu. */
export function RecordsPage() {
  const { filters, update } = useRecordsFilters()
  const events = useEvents(toEventFilters(filters))
  const stats = useEventStats(toStatsRange(filters))
  const cameras = useCameras()
  // Sayfa açıldığı gün: tarih seçicinin son günü ve "bugünse yalnızca saat" kuralı için.
  const [openedAt] = useState(() => new Date())

  const cameraNames = useMemo(
    () => new Map((cameras.data ?? []).map((c) => [c.id, c.name])),
    [cameras.data],
  )

  // Turuncu "şu an" sütunu yalnızca grafik bugünü tek başına gösterirken anlamlı. Birden çok gün
  // üst üste toplanınca "şu anki saat" hiçbir sütuna karşılık gelmez. Saat, verinin çekildiği an.
  const statsAt = new Date(stats.dataUpdatedAt)
  const currentHour =
    stats.data && isOnlyDay(filters, toDateInputValue(statsAt)) ? statsAt.getHours() : null
  const hourTotal = stats.data?.by_hour.reduce((sum, h) => sum + h.count, 0)

  const result = events.data
  const beyondLastPage = result !== undefined && result.items.length === 0 && result.total > 0

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Anomali kayıtları"
        description={cameras.data ? `${cameras.data.length} kamera` : undefined}
        actions={
          <DateRangeFilter
            from={filters.from}
            to={filters.to}
            max={toDateInputValue(openedAt)}
            onChange={(range) => update(range)}
          />
        }
      />

      {stats.isError ? (
        <ErrorBox message="Grafikler yüklenemedi." onRetry={() => void stats.refetch()} />
      ) : (
        <div className="flex flex-wrap items-stretch gap-4">
          <Card className="flex min-w-0 flex-[2_1_480px] flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold">Saatlik tespit</h2>
              {hourTotal !== undefined && (
                <span className="text-[13px] text-zinc-500">Toplam {hourTotal}</span>
              )}
            </div>
            {stats.data ? (
              <HourlyChart byHour={stats.data.by_hour} currentHour={currentHour} />
            ) : (
              <Skeleton className="h-[200px]" />
            )}
          </Card>
          <Card className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
            <h2 className="text-base font-semibold">Türe göre dağılım</h2>
            {stats.data ? (
              <TypeDistribution byType={stats.data.by_type} />
            ) : (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-7" />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <RecordsSearch value={filters.q} onChange={(q) => update({ q })} />
        <FilterChips
          label="Kategori"
          options={categoryOptions}
          value={filters.category}
          onChange={(category) => update({ category })}
        />
      </div>

      {events.isError ? (
        <ErrorBox message="Kayıtlar yüklenemedi." onRetry={() => void events.refetch()} />
      ) : (
        <div className="flex flex-col gap-3">
          <RecordsTable
            events={result?.items}
            cameraNames={cameraNames}
            now={openedAt}
            stale={events.isPlaceholderData}
          />
          {beyondLastPage ? (
            <div>
              <Button variant="secondary" size="sm" onClick={() => update({ page: 1 })}>
                İlk sayfaya dön
              </Button>
            </div>
          ) : (
            result && (
              <Pagination
                page={filters.page}
                pageSize={RECORDS_PAGE_SIZE}
                total={result.total}
                onPageChange={(next) => update({ page: next })}
                disabled={events.isPlaceholderData}
              />
            )
          )}
        </div>
      )}
    </section>
  )
}
