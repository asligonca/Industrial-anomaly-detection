import { useCameras } from '@/api/hooks/useCameras'
import { OPEN_EVENTS_LIMIT, useOpenEvents } from '@/api/hooks/useOpenEvents'
import { ErrorBox } from '@/components/ui/ErrorBox'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMemo } from 'react'
import { EventListItem } from './EventListItem'

const SKELETON_COUNT = 3

/** Bekleyen (açık + inceleniyor) olaylar, en yeni önce. */
export function EventsPage() {
  const events = useOpenEvents()
  const cameras = useCameras()

  const cameraNames = useMemo(
    () => new Map((cameras.data ?? []).map((c) => [c.id, c.name])),
    [cameras.data],
  )

  const total = events.data?.total
  const shown = events.data?.items.length ?? 0

  return (
    <section className="flex max-w-[960px] flex-col gap-6">
      <PageHeader
        title="Olaylar"
        description={total === undefined ? undefined : `${total} açık olay`}
      />

      {events.isPending ? (
        <ul className="flex flex-col gap-3" aria-busy="true" aria-label="Olaylar yükleniyor">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <li key={i}>
              <Skeleton className="h-[110px] rounded-card" />
            </li>
          ))}
        </ul>
      ) : events.isError ? (
        <ErrorBox message="Olaylar yüklenemedi." onRetry={() => void events.refetch()} />
      ) : shown === 0 ? (
        <div className="rounded-card border border-zinc-200 bg-white p-12 text-center text-[15px] text-zinc-500">
          Bekleyen olay yok
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {events.data.items.map((event) => (
              <EventListItem
                key={event.id}
                event={event}
                cameraName={cameraNames.get(event.camera_id)}
              />
            ))}
          </ul>
          {total !== undefined && total > shown && (
            <p className="text-sm text-zinc-500">
              En yeni {OPEN_EVENTS_LIMIT} olay gösteriliyor; daha eskileri Kayıtlar ekranında.
            </p>
          )}
        </>
      )}
    </section>
  )
}
