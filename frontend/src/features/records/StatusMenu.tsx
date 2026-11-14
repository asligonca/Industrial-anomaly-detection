import { useUpdateEventStatus } from '@/api/hooks/useUpdateEventStatus'
import { StatusBadge } from '@/components/ui/Badge'
import { eventCode, eventStatusLabels, statusActionsFor } from '@/lib/labels'
import type { AnomalyEvent, EventStatus } from '@/types'
import { useEffect, useId, useRef, useState, type ToggleEvent } from 'react'

/** Menünün aşağıya sığması için gereken yaklaşık yükseklik (3 seçenek). */
const MENU_SPACE = 140
const GAP = 4

/**
 * Tablo satırında durum ve durum değiştirme menüsü. Kapanmış olayda yalnızca durum yazar.
 * Menü tarayıcının popover özelliğiyle açılır: dışarı tıklayınca ve Escape ile kendiliğinden
 * kapanır, kapanınca odak düğmeye döner. Tablo yatay kaydığı için menü satırın içinde değil,
 * sayfanın üst katmanında çizilir; konumu açılırken düğmeye göre hesaplanır.
 */
export function StatusMenu({ event }: { event: AnomalyEvent }) {
  const update = useUpdateEventStatus()
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  // Sayfa ya da tablo kayarsa menü düğmeden kopmasın: kapat.
  useEffect(() => {
    if (!open) return
    const close = () => menuRef.current?.hidePopover()
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const actions = statusActionsFor(event.status)
  const closed = actions.length === 0

  // Olay kapanınca menü düğmesi kaybolur. Odak oradaysa sayfanın başına düşmesin, aynı satırdaki
  // "Aç" bağlantısına geçsin. (Satır, liste yeniden çekilince değişir; mutate'in onSuccess'i o
  // sırada düğmeyi artık bulamaz, bu yüzden effect.)
  const refocusOnClose = useRef(false)
  const closedRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!closed || !refocusOnClose.current) return
    refocusOnClose.current = false
    closedRef.current?.closest('tr')?.querySelector<HTMLElement>('a[href]')?.focus()
  }, [closed])

  if (closed) {
    return (
      <span ref={closedRef}>
        <StatusBadge status={event.status} variant="dot" />
      </span>
    )
  }

  function place(e: ToggleEvent<HTMLDivElement>) {
    const menu = e.currentTarget
    const trigger = triggerRef.current
    if (e.newState !== 'open' || !trigger) return
    // Kayıt sürerken menü açılmaz. Düğme `disabled` değil: odak düğmede kalsın diye.
    if (update.isPending) {
      e.preventDefault()
      return
    }
    const rect = trigger.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom >= MENU_SPACE
    menu.style.left = `${rect.left}px`
    menu.style.top = below ? `${rect.bottom + GAP}px` : ''
    menu.style.bottom = below ? '' : `${window.innerHeight - rect.top + GAP}px`
  }

  function choose(status: EventStatus) {
    menuRef.current?.hidePopover()
    // Popover kapanınca odak düğmeye döner; klavyeyle çalışan kullanıcı odakta mı?
    refocusOnClose.current = document.activeElement === triggerRef.current
    update.mutate({ id: event.id, status })
  }

  const code = eventCode(event.id)

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={menuId}
        aria-disabled={update.isPending}
        aria-label={`${code} durumunu değiştir. Şu an: ${eventStatusLabels[event.status]}`}
        className="-mx-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 hover:bg-zinc-100 aria-disabled:cursor-wait"
      >
        {update.isPending ? (
          <span className="text-[13px] text-zinc-500">Kaydediliyor…</span>
        ) : (
          <StatusBadge status={event.status} variant="dot" />
        )}
        <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" className="text-zinc-500">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" />
        </svg>
      </button>

      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        onBeforeToggle={place}
        onToggle={(e) => {
          const opened = e.newState === 'open'
          setOpen(opened)
          // Klavyeyle açan kullanıcı doğrudan ilk seçenekte olsun.
          if (opened) e.currentTarget.querySelector('button')?.focus()
        }}
        className="fixed inset-auto m-0 min-w-44 rounded-control border border-zinc-200 bg-white p-1 text-zinc-900 shadow-popover"
      >
        {actions.map((action) => (
          <button
            key={action.status}
            type="button"
            onClick={() => choose(action.status)}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 focus-visible:bg-zinc-100"
          >
            {action.label}
          </button>
        ))}
      </div>

      {update.isError && (
        <p role="alert" title={update.error.message} className="text-[12px] text-danger">
          Kaydedilemedi
        </p>
      )}
    </div>
  )
}
