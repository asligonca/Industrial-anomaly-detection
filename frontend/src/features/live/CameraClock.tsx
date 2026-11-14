import { formatDateTime } from '@/lib/format'
import { useNow } from '@/lib/useNow'

/** Kamera kartının sol altındaki, saniyede bir ilerleyen saat. */
export function CameraClock() {
  const now = new Date(useNow())
  return (
    <time dateTime={now.toISOString()} className="font-mono text-xs text-zinc-200">
      {formatDateTime(now)}
    </time>
  )
}
