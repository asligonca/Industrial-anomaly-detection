import { isNotFound } from '@/api/client'
import { useAgentsStatus } from '@/api/hooks/useAgentsStatus'
import { Card } from '@/components/ui/Card'
import { ErrorBox } from '@/components/ui/ErrorBox'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatSeconds, formatTime } from '@/lib/format'
import { agentLabels } from '@/lib/labels'
import type { AgentStatus } from '@/types'
import { agentRole, agentStats, agentStateText } from './agentText'

const SKELETON_COUNT = 3

/** "Ajan hattı": Gözcü -> İSG Mevzuat -> Koordinatör kartları ve son kararın saati / süresi. */
export function AgentPipeline() {
  const status = useAgentsStatus()
  const last = status.data?.last_decision

  return (
    <Card className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Ajan hattı</h2>
        {last && (
          <span className="font-mono text-xs text-zinc-500">
            son karar <time dateTime={last.at}>{formatTime(new Date(last.at))}</time> ·{' '}
            {formatSeconds(last.total_ms)}
          </span>
        )}
      </div>

      {status.isPending ? (
        <div className="flex flex-wrap gap-3" aria-busy="true" aria-label="Ajanlar yükleniyor">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <Skeleton key={i} className="h-[104px] flex-[1_1_220px] rounded-card" />
          ))}
        </div>
      ) : status.isError && isNotFound(status.error) ? (
        <p className="text-sm text-zinc-500">Ajan durumu henüz yayınlanmıyor.</p>
      ) : status.isError ? (
        <ErrorBox message="Ajan durumu yüklenemedi." onRetry={() => void status.refetch()} />
      ) : (
        <ol className="flex flex-col gap-2 md:flex-row">
          {status.data.agents.map((agent, i, agents) => (
            <li
              key={agent.name}
              className="flex min-w-0 flex-[1_1_220px] flex-col items-stretch gap-2 md:flex-row md:items-center"
            >
              <AgentCard agent={agent} />
              {/* Hat oku: dar ekranda aşağı, genişte sağa. Son kartta yok. */}
              {i < agents.length - 1 && (
                <span aria-hidden className="self-center text-lg text-zinc-400">
                  <span className="md:hidden">↓</span>
                  <span className="max-md:hidden">→</span>
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

function AgentCard({ agent }: { agent: AgentStatus }) {
  const busy = agent.state === 'busy'
  const state = agentStateText[agent.state]
  const stats = agentStats(agent)

  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-1.5 self-stretch rounded-card border bg-zinc-50 p-4',
        busy ? 'border-warn' : 'border-zinc-200',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn(
            'size-2 flex-none rounded-full',
            agent.state === 'idle' && 'bg-ok',
            agent.state === 'busy' && 'bg-warn',
            agent.state === 'down' && 'bg-danger',
          )}
        />
        <h3 className="text-[15px] font-semibold">{agentLabels[agent.name]}</h3>
        <span className="sr-only">{`: ${state.label}`}</span>
        {state.badge && (
          <span
            aria-hidden
            className={cn(
              'ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider',
              busy ? 'bg-warn text-zinc-900' : 'bg-danger text-white',
            )}
          >
            {state.badge}
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-600">{agentRole(agent)}</p>
      {stats && <p className="font-mono text-xs text-zinc-500">{stats}</p>}
    </div>
  )
}
