import { eventSnapshotUrl } from '@/api/events'
import { formatDateTime } from '@/lib/format'
import { cameraCode, eventTypeLabels } from '@/lib/labels'
import type { AnomalyEvent, BBox } from '@/types'
import { useState, type CSSProperties } from 'react'

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const percent = (v: number) => `${(v * 100).toFixed(2)}%`

/** [x1, y1, x2, y2] (0–1) -> görüntü üstünde mutlak konumlu kutu. Ters köşeler de düzelir. */
function bboxStyle([x1, y1, x2, y2]: BBox): CSSProperties {
  const left = clamp(Math.min(x1, x2))
  const top = clamp(Math.min(y1, y2))
  return {
    left: percent(left),
    top: percent(top),
    width: percent(clamp(Math.max(x1, x2)) - left),
    height: percent(clamp(Math.max(y1, y2)) - top),
  }
}

interface EventSnapshotProps {
  event: AnomalyEvent
  cameraName?: string
}

/**
 * Olay anındaki kare ve tespit kutusu. Görüntü kendi en-boy oranıyla çizilir (kırpılmaz);
 * böylece normalize `bbox` doğru yere düşer.
 */
export function EventSnapshot({ event, cameraName }: EventSnapshotProps) {
  const [failed, setFailed] = useState(false)
  const type = eventTypeLabels[event.type]

  return (
    <figure className="relative overflow-hidden rounded-card bg-zinc-800">
      {failed ? (
        <div className="grid aspect-video place-items-center text-sm text-zinc-300">
          Görüntü yüklenemedi
        </div>
      ) : (
        <div className="relative">
          <img
            src={eventSnapshotUrl(event)}
            alt={`${type} tespiti${cameraName ? `, ${cameraName}` : ''}`}
            onError={() => setFailed(true)}
            className="block h-auto w-full"
          />
          <div
            aria-hidden
            className="absolute rounded-sm border-2 border-warn"
            style={bboxStyle(event.bbox)}
          />
        </div>
      )}

      <figcaption className="pointer-events-none absolute inset-x-0 top-0 flex justify-between gap-4 bg-linear-to-b from-zinc-900/80 to-transparent px-[18px] pt-3.5 pb-6">
        <div className="min-w-0">
          <div className="font-mono text-xs text-camera-code">{cameraCode(event.camera_id)}</div>
          {cameraName && (
            <div className="truncate text-base font-semibold text-white">{cameraName}</div>
          )}
        </div>
        <time dateTime={event.created_at} className="flex-none font-mono text-xs text-zinc-200">
          {formatDateTime(new Date(event.created_at))}
        </time>
      </figcaption>
    </figure>
  )
}
