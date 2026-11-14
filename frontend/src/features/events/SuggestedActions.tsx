import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { cameraCode } from '@/lib/labels'
import { useEventActionsStore, type SuggestedActionKey } from '@/store/eventActions'
import type { AnomalyEvent } from '@/types'

interface ActionDef {
  key: SuggestedActionKey
  title: string
  description: (event: AnomalyEvent) => string
  button: string
  doneLabel: string
}

const actions: ActionDef[] = [
  {
    key: 'notify',
    title: 'Bölge sorumlusunu bilgilendir',
    description: () => 'Vardiya amiri · SMS ve uygulama bildirimi',
    button: 'Bildir',
    doneLabel: 'Gönderildi',
  },
  {
    key: 'announce',
    title: 'Sahaya sesli anons yap',
    description: (event) => `${cameraCode(event.camera_id)} hoparlörü · hazır metin`,
    button: 'Anons et',
    doneLabel: 'Anons edildi',
  },
  {
    key: 'lock',
    title: 'Bölge kapısını kilitle',
    description: () => 'Erişim kontrol sistemi · çıkış serbest',
    button: 'Kilitle',
    doneLabel: 'Kilitlendi',
  },
]

const EMPTY: SuggestedActionKey[] = []

interface SuggestedActionsProps {
  event: AnomalyEvent
  /** Olay kapalıysa yapılmamış aksiyonlar tıklanamaz. */
  disabled: boolean
}

/**
 * Koordinatörün önerdiği aksiyonlar. Şimdilik yalnızca arayüz: tek tıkla "yapıldı" olur,
 * işaret bu tarayıcıda hatırlanır, backend'e istek gitmez.
 */
export function SuggestedActions({ event, disabled }: SuggestedActionsProps) {
  const done = useEventActionsStore((s) => s.done[String(event.id)] ?? EMPTY)
  const markDone = useEventActionsStore((s) => s.markDone)

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">Önerilen aksiyonlar</h2>
      <ul className="flex flex-col gap-3">
        {actions.map((action) => {
          const isDone = done.includes(action.key)
          return (
            <li
              key={action.key}
              className="flex items-center gap-3 rounded-xl bg-zinc-100 py-3 pr-3 pl-4"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{action.title}</div>
                <div className="mt-0.5 text-xs text-zinc-500">{action.description(event)}</div>
              </div>
              <button
                type="button"
                disabled={isDone || disabled}
                aria-label={isDone ? `${action.title}: ${action.doneLabel}` : undefined}
                onClick={() => markDone(event.id, action.key)}
                className={cn(
                  'h-[38px] flex-none rounded-[9px] border px-3.5 text-[13px] font-semibold whitespace-nowrap',
                  isDone
                    ? 'border-zinc-400 bg-transparent text-zinc-600'
                    : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                {isDone ? action.doneLabel : action.button}
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
