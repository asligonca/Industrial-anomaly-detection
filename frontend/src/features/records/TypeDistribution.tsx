import { cn } from '@/lib/cn'
import { eventTypeStatLabel } from '@/lib/labels'
import type { EventStats } from '@/types'
import { typeBarColor } from './chartColors'

/** Türe göre dağılım: en çok görülen üstte, çubuk boyu en büyük değere oranlı. */
export function TypeDistribution({ byType }: { byType: EventStats['by_type'] }) {
  const rows = byType.filter((d) => d.count > 0).sort((a, b) => b.count - a.count)

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">Bu aralıkta tespit yok.</p>
  }

  const max = rows[0]!.count
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((row) => (
        <li key={row.type} className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-3 text-[13px]">
            <span>{eventTypeStatLabel(row.type)}</span>
            <span className="text-zinc-500">{row.count}</span>
          </div>
          <div aria-hidden className="h-1.5 rounded-full bg-chart-track">
            <div
              className={cn('h-1.5 rounded-full', typeBarColor(row.type))}
              style={{ width: `${Math.round((row.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
