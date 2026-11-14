import { useUpdateEventStatus } from '@/api/hooks/useUpdateEventStatus'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/inputStyles'
import { isOpenStatus, statusActionsFor } from '@/lib/labels'
import type { AnomalyEvent, EventStatus } from '@/types'
import { useState } from 'react'

const NOTE_MAX_LENGTH = 500

/**
 * Olay durumunu değiştiren düğmeler ve isteğe bağlı not. Olay kapanınca hiç görünmez.
 * Üstlen: Açık -> İnceleniyor. Yanlış alarm ve Olayı kapat: tek tık, onay sorulmaz.
 */
export function EventStatusActions({ event }: { event: AnomalyEvent }) {
  const update = useUpdateEventStatus()
  const [note, setNote] = useState('')

  if (!isOpenStatus(event.status)) return null

  const pendingStatus = update.isPending ? update.variables.status : null

  function submit(status: EventStatus) {
    const trimmed = note.trim()
    update.mutate(
      { id: event.id, status, ...(trimmed ? { note: trimmed } : {}) },
      { onSuccess: () => setNote('') },
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
          disabled={update.isPending}
          className={inputClass('md', 'w-full sm:w-56')}
        />
        {statusActionsFor(event.status).map((action) => (
          <Button
            key={action.status}
            // Asıl eylem (kapatmak) koyu, diğerleri çerçeveli.
            variant={action.status === 'confirmed' ? 'primary' : 'secondary'}
            size="md"
            disabled={update.isPending}
            onClick={() => submit(action.status)}
          >
            {label(action.status, action.label)}
          </Button>
        ))}
      </div>
      {update.isError && (
        <p role="alert" className="text-[13px] text-danger">
          Durum güncellenemedi: {update.error.message}
        </p>
      )}
    </div>
  )
}
