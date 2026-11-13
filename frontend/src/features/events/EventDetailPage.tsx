import { ApiError } from '@/api/client'
import { useCameras } from '@/api/hooks/useCameras'
import { useEvent } from '@/api/hooks/useEvent'
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge'
import { LinkButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBox } from '@/components/ui/ErrorBox'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatConfidence } from '@/lib/format'
import { cameraCode, eventCode, eventTypeLabels, isOpenStatus } from '@/lib/labels'
import type { EventDetail } from '@/types'
import { Link, useParams } from 'react-router-dom'
import { AgentTimeline } from './AgentTimeline'
import { EventSnapshot } from './EventSnapshot'
import { EventStatusActions } from './EventStatusActions'
import { SuggestedActions } from './SuggestedActions'
import { voiceSummaryText } from './voiceSummaryText'
import { VoiceSummary } from './VoiceSummary'

/** "14" -> 14; "abc", "1.5", "-3" -> null (istek atılmaz, "bulunamadı" gösterilir). */
function parseId(raw: string | undefined): number | null {
  return raw && /^\d+$/.test(raw) ? Number(raw) : null
}

function Breadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Konum">
      <ol className="flex items-center gap-2 text-sm text-zinc-500">
        <li>
          <Link to="/events" className="text-zinc-500 underline hover:text-zinc-700">
            Olaylar
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li aria-current="page" className="font-mono text-[13px] text-zinc-900">
          {current}
        </li>
      </ol>
    </nav>
  )
}

function NotFound() {
  return (
    <EmptyState
      title="Olay bulunamadı"
      description="Adres hatalı olabilir ya da olay silinmiş."
      action={<LinkButton to="/events">Olaylara dön</LinkButton>}
    />
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Olay yükleniyor">
      <Skeleton className="h-9 w-2/3" />
      <div className="flex flex-wrap items-start gap-6">
        <Skeleton className="aspect-video min-w-0 flex-[3_1_520px] rounded-card" />
        <Skeleton className="h-80 min-w-0 flex-[2_1_340px] rounded-card" />
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3.5">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-1 font-mono text-sm break-words">{value}</dd>
    </div>
  )
}

function EventDetailView({ event, cameraName }: { event: EventDetail; cameraName?: string }) {
  const type = eventTypeLabels[event.type]
  const code = cameraCode(event.camera_id)
  const open = isOpenStatus(event.status)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <SeverityBadge severity={event.severity} size="lg" />
          <h1 className="text-[28px] font-bold tracking-tight">
            {type} · {cameraName ?? code}
          </h1>
          <StatusBadge status={event.status} />
        </div>
        <EventStatusActions event={event} />
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-4">
          <EventSnapshot event={event} cameraName={cameraName} />
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            <MetaItem label="Tespit modeli" value={event.model_version} />
            <MetaItem label="Güven skoru" value={formatConfidence(event.confidence)} />
            <MetaItem label="Kamera" value={code} />
            <MetaItem label="Bölge" value={event.zone?.name ?? '—'} />
          </dl>
          <VoiceSummary text={voiceSummaryText(event, cameraName ?? code)} />
        </div>

        <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-4">
          <AgentTimeline eventId={event.id} />
          <SuggestedActions event={event} disabled={!open} />
        </div>
      </div>
    </div>
  )
}

/** Olay detayı: görüntü, meta, durum düğmeleri, ajan analizi, aksiyonlar, sesli özet. */
export function EventDetailPage() {
  const params = useParams()
  const id = parseId(params.id)
  const event = useEvent(id)
  const cameras = useCameras()

  const notFound = id === null || (event.error instanceof ApiError && event.error.status === 404)
  const cameraName = event.data
    ? cameras.data?.find((c) => c.id === event.data.camera_id)?.name
    : undefined

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb current={id === null ? (params.id ?? '') : eventCode(id)} />
      {notFound ? (
        <NotFound />
      ) : event.isPending ? (
        <DetailSkeleton />
      ) : event.isError ? (
        <ErrorBox message="Olay yüklenemedi." onRetry={() => void event.refetch()} />
      ) : (
        // key: başka olaya geçince görüntü hatası ve ses durumu sıfırlansın.
        <EventDetailView key={event.data.id} event={event.data} cameraName={cameraName} />
      )}
    </section>
  )
}
