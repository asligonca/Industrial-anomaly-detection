import { useDeleteZone } from '@/api/hooks/useDeleteZone'
import { Button } from '@/components/ui/Button'
import { ruleTypeLabels } from '@/lib/labels'
import type { Zone } from '@/types'
import { useCallback, useRef, useState } from 'react'
import { adminRowClass, inlineErrorClass } from './adminStyles'

interface ZoneRowProps {
  zone: Zone
  cameraName: string
  /** Silme isteği gönderilmeden hemen önce: satır kaybolunca odağı listenin taşıyacağı yer. */
  onDeleteStart: (id: number) => void
}

/**
 * Bölge satırı. "Sil" önce satırın içinde onay ister ("Vazgeç / Sil"); tarayıcının `confirm()`
 * penceresi kullanılmaz. Onayda odak "Vazgeç"e gider (yanlışlıkla Enter silmesin), vazgeçince
 * "Sil" düğmesine döner. Escape de vazgeçer.
 */
export function ZoneRow({ zone, cameraName, onDeleteStart }: ZoneRowProps) {
  const remove = useDeleteZone()
  const [confirming, setConfirming] = useState(false)
  const restoreFocus = useRef(false)

  // Ref geri çağırmaları sabit olmalı; değişirse React her çizimde yeniden çağırır ve odak kayar.
  const focusOnMount = useCallback((el: HTMLButtonElement | null) => el?.focus(), [])
  const focusIfRestoring = useCallback((el: HTMLButtonElement | null) => {
    if (!el || !restoreFocus.current) return
    restoreFocus.current = false
    el.focus()
  }, [])

  function cancel() {
    if (remove.isPending) return
    restoreFocus.current = true
    remove.reset()
    setConfirming(false)
  }

  function confirm() {
    onDeleteStart(zone.id)
    remove.mutate(zone.id)
  }

  return (
    <li
      onKeyDown={(e) => {
        if (confirming && e.key === 'Escape') cancel()
      }}
      className={adminRowClass(
        'flex flex-wrap items-center gap-x-4 gap-y-2 py-3 sm:grid sm:grid-cols-[1fr_1fr_1.2fr_150px]',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:contents">
        <span className="font-medium">{zone.name}</span>
        {confirming ? (
          <span className="text-zinc-600 sm:col-span-2">
            Bu bölge silinsin mi? Geri alınamaz.
            {remove.isError && (
              <span role="alert" className={`${inlineErrorClass} block`}>
                Silinemedi: {remove.error.message}
              </span>
            )}
          </span>
        ) : (
          <>
            <span className="text-zinc-500">{cameraName}</span>
            <span className="text-zinc-500">{ruleTypeLabels[zone.rule_type]}</span>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {confirming ? (
          <>
            <Button ref={focusOnMount} variant="secondary" size="sm" onClick={cancel}>
              Vazgeç
            </Button>
            <Button
              variant="danger"
              size="sm"
              aria-disabled={remove.isPending}
              aria-label={`${zone.name} bölgesini sil`}
              onClick={() => {
                if (!remove.isPending) confirm()
              }}
            >
              {remove.isPending ? 'Siliniyor…' : 'Sil'}
            </Button>
          </>
        ) : (
          <Button
            ref={focusIfRestoring}
            variant="danger"
            size="sm"
            aria-label={`${zone.name} bölgesini sil`}
            onClick={() => setConfirming(true)}
            className="w-[70px]"
          >
            Sil
          </Button>
        )}
      </div>
    </li>
  )
}
