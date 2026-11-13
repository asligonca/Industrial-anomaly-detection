import { eventSnapshotUrl } from '@/api/events'
import { SeverityBadge } from '@/components/ui/Badge'
import { LinkButton } from '@/components/ui/Button'
import { formatConfidence, formatDay, formatTime, isSameDay } from '@/lib/format'
import { cameraCode, eventCode, eventTypeLabels } from '@/lib/labels'
import type { AnomalyEvent } from '@/types'
import { useState } from 'react'
import { StatusMenu } from './StatusMenu'

interface RecordRowProps {
  event: AnomalyEvent
  /** Kamera listesi yüklenmediyse ya da kamera silindiyse yok. */
  cameraName?: string
  /** Şimdiki zaman: bugünkü kayıtta yalnızca saat yazar, eskilerde tarih de. */
  now: Date
}

/** Kayıtlar tablosunun tek satırı. */
export function RecordRow({ event, cameraName, now }: RecordRowProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const created = new Date(event.created_at)
  const type = eventTypeLabels[event.type]
  const code = eventCode(event.id)

  return (
    <tr className="border-b border-zinc-100 last:border-b-0">
      <td className="py-2.5 pr-4 pl-5">
        {/* Görüntü yüklenemezse koyu zemin kalır; bilgi diğer sütunlarda var. */}
        <div className="h-11 w-[72px] overflow-hidden rounded-md bg-zinc-800">
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
      </td>
      <td className="pr-4 font-mono text-[13px] text-zinc-600">{code}</td>
      <td className="pr-4">
        <time dateTime={event.created_at} className="flex flex-col font-mono text-[13px]">
          {formatTime(created)}
          {!isSameDay(created, now) && (
            <span className="text-[11px] text-zinc-400">{formatDay(created)}</span>
          )}
        </time>
      </td>
      <td className="pr-4">
        <span className="block font-mono text-[12px] text-camera-code-ink">
          {cameraCode(event.camera_id)}
        </span>
        {cameraName && <span className="block truncate">{cameraName}</span>}
      </td>
      <td className="truncate pr-4 font-semibold">{type}</td>
      <td className="pr-4">
        <span className="flex items-center gap-2 font-mono text-[13px]">
          <span aria-hidden className="h-1 w-9 rounded-full bg-chart-track">
            <span
              className="block h-1 rounded-full bg-zinc-900"
              style={{ width: `${Math.round(event.confidence * 100)}%` }}
            />
          </span>
          {formatConfidence(event.confidence)}
        </span>
      </td>
      <td className="pr-4">
        <SeverityBadge severity={event.severity} size="sm" />
      </td>
      <td className="pr-4">
        <StatusMenu event={event} />
      </td>
      <td className="pr-5 text-right">
        <LinkButton to={`/events/${event.id}`} size="sm" aria-label={`${code} ${type} kaydını aç`}>
          Aç
        </LinkButton>
      </td>
    </tr>
  )
}
