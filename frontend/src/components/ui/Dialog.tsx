import { useEffect, useId, useRef, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  /** Escape, "Kapat" düğmesi ya da içerikten kapatma isteği. */
  onClose: () => void
  title: string
  description?: string
  /** Yalnızca açıkken çizilir: her açılışta form temiz başlar. */
  children: ReactNode
}

/**
 * Tarayıcının `<dialog>` öğesiyle açılan pencere. `showModal()` arkadaki sayfayı tıklanamaz yapar,
 * odağı pencerenin içinde tutar ve Escape ile kapanır. Açılınca odak `data-autofocus` işaretli
 * alana gider (yoksa ilk odaklanabilir öğeye), kapanınca açan düğmeye döner.
 * Odağı geri vermeyi tarayıcıya bırakmıyoruz: içerik `close()`'dan önce kalktığı için odak o anda
 * pencerede değildir ve tarayıcı geri vermez.
 * Dışarı tıklamak kapatmaz: yarım kalan form yanlışlıkla kaybolmasın.
 */
export function Dialog({ open, onClose, title, description, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={() => {
        openerRef.current?.focus()
        openerRef.current = null
        onClose()
      }}
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-panel border border-zinc-200 bg-white text-zinc-900 shadow-popover backdrop:bg-zinc-900/40"
    >
      {open && (
        <div className="flex flex-col gap-5 p-6">
          <header className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="text-sm text-zinc-600">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="-m-1.5 grid size-9 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <svg aria-hidden width="18" height="18" viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}
