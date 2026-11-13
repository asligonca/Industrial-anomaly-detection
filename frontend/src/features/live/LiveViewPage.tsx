import { useCameras } from '@/api/hooks/useCameras'
import { useOpenEvents } from '@/api/hooks/useOpenEvents'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBox } from '@/components/ui/ErrorBox'
import { FilterChips, type FilterOption } from '@/components/ui/FilterChips'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useMemo, useState } from 'react'
import { CameraTile } from './CameraTile'
import { cameraGroups, cameraHighlights } from './cameraHighlights'

const ALL = 'all'
const SKELETON_COUNT = 6

/** Geniş ekranda 3 sütun ve ilk kart 2×2; dar ekranda 2 sütun, hepsi eşit. */
const gridClass = 'grid auto-rows-[minmax(190px,22vh)] grid-cols-2 gap-3.5 lg:grid-cols-3'
const featuredClass = 'lg:col-span-2 lg:row-span-2'

/** Ana ekran: kamera ızgarası, grup filtresi, açık olay vurgusu. */
export function LiveViewPage() {
  const cameras = useCameras()
  // En yeni 200 açık olay; daha eskiler vurgulanmaz.
  const openEvents = useOpenEvents()
  const [group, setGroup] = useState<string>(ALL)

  const groups = useMemo(() => cameraGroups(cameras.data ?? []), [cameras.data])
  const highlights = useMemo(
    () => cameraHighlights(openEvents.data?.items ?? []),
    [openEvents.data],
  )

  // Seçili grup veriden kalkarsa (kamera silindi) filtre kendiliğinden "Tümü"ne döner.
  const activeGroup = group !== ALL && groups.includes(group) ? group : ALL
  const filterOptions: FilterOption<string>[] = [
    { value: ALL, label: 'Tümü' },
    ...groups.map((g) => ({ value: g, label: g })),
  ]

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Canlı izleme"
        description="İhlal işaretli bir kameraya tıklayarak olayı açın"
        actions={
          groups.length > 0 && (
            <FilterChips
              label="Kamera grubu"
              options={filterOptions}
              value={activeGroup}
              onChange={setGroup}
            />
          )
        }
      />

      {openEvents.isError && (
        <ErrorBox
          message="Açık olaylar yüklenemedi; ihlal işaretleri gösterilemiyor."
          onRetry={() => void openEvents.refetch()}
        />
      )}

      {cameras.isPending ? (
        <div className={gridClass} aria-busy="true" aria-label="Kameralar yükleniyor">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div key={i} className={cn('overflow-hidden rounded-card', i === 0 && featuredClass)}>
              <Skeleton className="size-full" />
            </div>
          ))}
        </div>
      ) : cameras.isError ? (
        <ErrorBox message="Kameralar yüklenemedi." onRetry={() => void cameras.refetch()} />
      ) : cameras.data.length === 0 ? (
        <EmptyState
          title="Kayıtlı kamera yok"
          description="Yönetici kamera eklediğinde burada görünür."
        />
      ) : (
        <div className={gridClass}>
          {cameras.data.map((camera, i) => {
            const featured = i === 0
            return (
              <CameraTile
                key={camera.id}
                camera={camera}
                highlight={highlights.get(camera.id)}
                featured={featured}
                className={featured ? featuredClass : undefined}
                dimmed={activeGroup !== ALL && camera.group !== activeGroup}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
