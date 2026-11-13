import { useUpdateEventStatus } from '@/api/hooks/useUpdateEventStatus'
import { Button } from '@/components/ui/Button'
import { isOpenStatus } from '@/lib/labels'
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
          className="h-[42px] w-full rounded-control border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 focus-visible:border-zinc-900 disabled:opacity-60 sm:w-56"
        />
        {event.status === 'new' && (
          <Button
            variant="secondary"
            size="md"
            disabled={update.isPending}
            onClick={() => submit('reviewing')}
          >
            {label('reviewing', 'Üstlen')}
          </Button>
        )}
        <Button
          variant="secondary"
          size="md"
          disabled={update.isPending}
          onClick={() => submit('false_alarm')}
        >
          {label('false_alarm', 'Yanlış alarm')}
        </Button>
        <Button size="md" disabled={update.isPending} onClick={() => submit('confirmed')}>
          {label('confirmed', 'Olayı kapat')}
        </Button>
      </div>
      {update.isError && (
        <p role="alert" className="text-[13px] text-danger">
          Durum güncellenemedi: {update.error.message}
        </p>
      )}
    </div>
  )
}
