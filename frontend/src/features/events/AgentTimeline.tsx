import { useEventAnalysis } from '@/api/hooks/useEventAnalysis'
import { Card } from '@/components/ui/Card'
import { ErrorBox } from '@/components/ui/ErrorBox'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatSeconds, formatTime } from '@/lib/format'
import { agentLabels } from '@/lib/labels'

/** Olayı işleyen ajanların sırayla verdiği kararlar. Son adım (karar) turuncu işaretlenir. */
export function AgentTimeline({ eventId }: { eventId: number }) {
  const analysis = useEventAnalysis(eventId)

  return (
    <Card className="flex flex-col gap-[18px]">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold">Ajan analizi</h2>
        {analysis.data && (
          <span className="font-mono text-xs text-zinc-500">
            toplam {formatSeconds(analysis.data.total_ms)}
          </span>
        )}
      </div>

      {analysis.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Analiz yükleniyor">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : analysis.isError ? (
        <ErrorBox message="Analiz yüklenemedi." onRetry={() => void analysis.refetch()} />
      ) : analysis.data.steps.length === 0 ? (
        <p className="text-sm text-zinc-500">Bu olay için analiz yok.</p>
      ) : (
        <ol className="flex flex-col">
          {analysis.data.steps.map((step, i, steps) => {
            const last = i === steps.length - 1
            return (
              <li key={i} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-7 flex-none place-items-center rounded-full text-[13px] font-bold',
                      last ? 'bg-warn text-zinc-900' : 'bg-zinc-900 text-white',
                    )}
                  >
                    {i + 1}
                  </span>
                  {!last && <span aria-hidden className="mt-1 w-0.5 flex-1 bg-zinc-200" />}
                </div>
                <div className={cn('min-w-0 flex-1', !last && 'pb-[18px]')}>
                  <div className="flex justify-between gap-2">
                    <h3 className="text-[15px] font-semibold">{agentLabels[step.agent]}</h3>
                    <time dateTime={step.at} className="font-mono text-xs text-zinc-500">
                      {formatTime(new Date(step.at))}
                    </time>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">{step.text}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}
