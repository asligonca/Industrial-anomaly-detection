import { useEvents } from '@/api/hooks/useEvents'
import { SeverityBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ErrorBox } from '@/components/ui/ErrorBox'
import { Skeleton } from '@/components/ui/Skeleton'
import { eventAnalysisPath } from '@/lib/eventLinks'
import { formatTime } from '@/lib/format'
import { eventCode, eventTypeLabel } from '@/lib/labels'
import type { AnomalyEvent } from '@/types'
import { Link } from 'react-router-dom'

/** Son kaç karar. Her olay ajan hattından geçer: olay = karar. */
const DECISION_COUNT = 5

/** Son kararlar: en yeni olaylar (tüm durumlar). Satır olayın ajan analizine götürür. */
export function RecentDecisions() {
  const events = useEvents({ limit: DECISION_COUNT })

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">Son kararlar</h2>
      {events.isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Kararlar yükleniyor">
          {Array.from({ length: DECISION_COUNT }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : events.isError ? (
        <ErrorBox message="Kararlar yüklenemedi." onRetry={() => void events.refetch()} />
      ) : events.data.items.length === 0 ? (
        <p className="text-sm text-zinc-500">Henüz karar yok.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100">
          {events.data.items.map((event) => (
            <DecisionRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </Card>
  )
}

function DecisionRow({ event }: { event: AnomalyEvent }) {
  const type = eventTypeLabel(event.type)
  return (
    <li>
      <Link
        to={eventAnalysisPath(event.id)}
        aria-label={`${eventCode(event.id)}: ${type}, ${event.camera.name}. Analizi aç`}
        className="-mx-2 grid grid-cols-[72px_1fr_auto] items-center gap-x-3 gap-y-1 rounded-control px-2 py-2.5 hover:bg-zinc-50 sm:grid-cols-[90px_1fr_90px_100px]"
      >
        <time dateTime={event.created_at} className="font-mono text-[13px] text-zinc-500">
          {formatTime(new Date(event.created_at))}
        </time>
        <span className="min-w-0 truncate text-sm">
          <span className="font-semibold">{type}</span>
          <span className="text-zinc-500"> · {event.camera.name}</span>
        </span>
        <span className="justify-self-start">
          <SeverityBadge severity={event.severity} />
        </span>
        <span className="text-[13px] font-medium text-zinc-600 underline-offset-2 max-sm:hidden sm:justify-self-end">
          Analizi aç
        </span>
      </Link>
    </li>
  )
}
