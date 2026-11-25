import { useUpdateEventStatus } from '@/api/hooks/useUpdateEventStatus'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/inputStyles'
import { isConflict } from '@/api/client'
import { statusActionsFor } from '@/lib/eventRules'
import type { AnomalyEvent, EventStatus } from '@/types'
import { useEffect, useRef, useState } from 'react'

const NOTE_MAX_LENGTH = 500

/**
 * Olay durumunu değiştiren düğmeler ve isteğe bağlı not (backend geçiş kuralları):
 * Açık: Üstlen / Yanlış alarm / Olayı kapat. İnceleniyor: İncelemeyi bırak / Yanlış alarm /
 * Olayı kapat. Kapanmış: Yeniden aç (-> İnceleniyor). Tek tık, onay sorulmaz.
 *
 * Odak: kayıt sürerken `disabled` yerine `aria-disabled` (odak düğmede kalır). Durum değişince
 * düğme seti değişir, tıklanan düğme kaybolur; odak `body`'ye düşmesin diye ilk düğmeye verilir.
 */
export function EventStatusActions({ event }: { event: AnomalyEvent }) {
  const update = useUpdateEventStatus()
  const [note, setNote] = useState('')
  const buttonsRef = useRef<HTMLDivElement>(null)
  /** Düğmeden gönderildi: yeni düğme setine odak verilecek. */
  const restoreFocus = useRef(false)

  const pendingStatus = update.isPending ? update.variables.status : null

  useEffect(() => {
    if (!restoreFocus.current) return
    restoreFocus.current = false
    const container = buttonsRef.current
    if (container && !container.contains(document.activeElement)) {
      container.querySelector<HTMLButtonElement>('button')?.focus()
    }
  }, [event.status])

  function submit(status: EventStatus) {
    if (update.isPending) return
    restoreFocus.current = true
    const trimmed = note.trim()
    update.mutate(
      { id: event.id, status, ...(trimmed ? { note: trimmed } : {}) },
      {
        onSuccess: () => setNote(''),
        // 409'da olay yeniden çekilir, durum (ve düğmeler) yine değişir; diğer hatalarda değişmez.
        onError: (error) => {
          if (!isConflict(error)) restoreFocus.current = false
        },
      },
    )
  }

  const label = (status: EventStatus, text: string) =>
    pendingStatus === status ? 'Kaydediliyor…' : text

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={NOTE_MAX_LENGTH}
          placeholder="Not (isteğe bağlı)"
          aria-label="Durum notu (isteğe bağlı)"
          readOnly={update.isPending}
          aria-disabled={update.isPending || undefined}
          className={inputClass('md', 'w-full sm:w-56')}
        />
        <div ref={buttonsRef} className="contents">
          {statusActionsFor(event.status).map((action) => (
            <Button
              key={action.status}
              // Asıl eylem (kapatmak) koyu, diğerleri çerçeveli.
              variant={action.status === 'confirmed' ? 'primary' : 'secondary'}
              size="md"
              aria-disabled={update.isPending || undefined}
              onClick={() => submit(action.status)}
            >
              {label(action.status, action.label)}
            </Button>
          ))}
        </div>
      </div>
      {update.isError && (
        <p role="alert" className="text-[13px] text-danger">
          {isConflict(update.error)
            ? 'Olayın durumu bu arada değişmiş; sayfa güncellendi.'
            : `Durum güncellenemedi: ${update.error.message}`}
        </p>
      )}
    </div>
  )
}
