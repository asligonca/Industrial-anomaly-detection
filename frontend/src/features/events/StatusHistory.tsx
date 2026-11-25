import { Card } from '@/components/ui/Card'
import { formatRelativeDayTime } from '@/lib/format'
import { eventStatusLabels } from '@/lib/labels'
import type { AlarmAction } from '@/types'

/**
 * Olayın durum geçmişi (`alarm_actions`): kim, ne zaman, hangi durumdan hangisine, not.
 * En yeni üstte (backend eskiden yeniye döner, burada ters çevrilir). Saat, detay açıldığı ana
 * göre "Bugün / Dün" yazılır. Kullanıcı silinmişse `user` null gelir.
 */
export function StatusHistory({ actions, now }: { actions: AlarmAction[]; now: Date }) {
  const time = (action: AlarmAction) => new Date(action.created_at).getTime()
  const newestFirst = [...actions].sort((a, b) => time(b) - time(a))

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">Durum geçmişi</h2>
      {newestFirst.length === 0 ? (
        <p className="text-sm text-zinc-500">Henüz durum değişikliği yok.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-zinc-100">
          {newestFirst.map((action) => (
            <li key={action.id} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-medium">
                  {eventStatusLabels[action.from_status]}
                  <span aria-hidden> → </span>
                  <span className="sr-only"> durumundan </span>
                  {eventStatusLabels[action.to_status]}
                </span>
                <span className="text-zinc-500">
                  {action.user?.username ?? 'Silinmiş kullanıcı'}
                </span>
              </div>
              <time dateTime={action.created_at} className="font-mono text-xs text-zinc-500">
                {formatRelativeDayTime(new Date(action.created_at), now)}
              </time>
              {action.note && <p className="text-[13px] text-zinc-600">{action.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
