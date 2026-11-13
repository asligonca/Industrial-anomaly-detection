import { eventSnapshotUrl } from '@/api/events'
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge'
import { LinkButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatEventTime } from '@/lib/format'
import { cameraCode, eventCode, eventTypeLabel } from '@/lib/labels'
import type { AnomalyEvent } from '@/types'
import { useState } from 'react'

interface EventListItemProps {
  event: AnomalyEvent
  /** Kamera listesi yüklenmediyse ya da kamera silindiyse yok. */
  cameraName?: string
}

/** Olaylar listesindeki tek kart: küçük görüntü, önem, saat, tür, kamera ve "İncele". */
export function EventListItem({ event, cameraName }: EventListItemProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const type = eventTypeLabel(event.type)
  const camera = cameraName
    ? `${cameraCode(event.camera_id)} · ${cameraName}`
    : cameraCode(event.camera_id)

  return (
    <li>
      <Card padding="none" className="flex items-center gap-4 py-3.5 pr-4 pl-3.5 sm:gap-5 sm:pr-5">
        {/* Görüntü yüklenemezse koyu zemin kalır; bilgi yazılarda var. */}
        <div className="h-[60px] w-24 flex-none overflow-hidden rounded-control bg-zinc-800 sm:h-20 sm:w-[132px]">
          {!imageFailed && (
            <img
              src={eventSnapshotUrl(event)}
              alt=""
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="size-full object-cover"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <SeverityBadge severity={event.severity} />
            <time dateTime={event.created_at} className="font-mono text-[13px] text-zinc-500">
              {formatEventTime(new Date(event.created_at))}
            </time>
            <StatusBadge status={event.status} variant="dot" />
          </div>
          <div className="truncate text-[17px] font-semibold">{type}</div>
          <div className="truncate text-[13px] text-zinc-500">{camera}</div>
        </div>

        <LinkButton
          to={`/events/${event.id}`}
          variant="primary"
          aria-label={`${eventCode(event.id)} ${type} olayını incele`}
          className="flex-none"
        >
          İncele
        </LinkButton>
      </Card>
    </li>
  )
}
