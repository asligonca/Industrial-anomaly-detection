import { cn } from '@/lib/cn'
import { useToastStore, type Toast } from '@/store/toasts'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconButton } from './Button'
import { CloseIcon } from './icons'

/** Bildirim bu kadar sonra kendiliğinden kalkar; üstündeyken (fare ya da odak) süre durur. */
const TOAST_DURATION_MS = 10_000

/** Bildirim kapanınca odak başka bildirim yoksa buraya döner (`AppShell` `<main>`'i). */
export const MAIN_CONTENT_ID = 'main-content'

/**
 * Bildirimlerin göründüğü alan: üst barın altında, sağda. Listeler her zaman çizilir (boşken de)
 * ki `aria-live` yeni bildirimi okusun. Kritik bildirimler ayrı, `assertive` listede ve üstte:
 * ekran okuyucu o anki okumayı keserek duyurur.
 */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)
  const critical = toasts.filter((t) => t.tone === 'critical')
  const info = toasts.filter((t) => t.tone !== 'critical')

  return (
    <section
      aria-label="Bildirimler"
      className="pointer-events-none fixed top-20 right-4 z-40 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 max-sm:top-28"
    >
      <ol aria-live="assertive" className="flex flex-col gap-2 empty:hidden">
        {critical.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </ol>
      <ol aria-live="polite" className="flex flex-col gap-2 empty:hidden">
        {info.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </ol>
    </section>
  )
}

/**
 * Odaktaki bildirim kapanınca odak `body`'ye düşmesin: yanındaki bildirimin kapat düğmesine, yoksa
 * ana içeriğe verilir (FE-9 `Dialog` dersi). Odak bildirimde değilse dokunulmaz.
 */
function focusAfterClose(item: HTMLElement | null) {
  if (!item?.contains(document.activeElement)) return
  const section = item.closest('section')
  const others = [...(section?.querySelectorAll('li') ?? [])].filter((li) => li !== item)
  const next = others[0]?.querySelector('button') ?? document.getElementById(MAIN_CONTENT_ID)
  next?.focus()
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss)
  // Kararlı: başka bildirim gelince bu bildirimin süresi baştan başlamasın.
  const onDismiss = useCallback(() => dismiss(toast.id), [dismiss, toast.id])
  const itemRef = useRef<HTMLLIElement>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const paused = hovered || focused

  useEffect(() => {
    if (paused) return
    const timer = window.setTimeout(onDismiss, TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [paused, onDismiss])

  return (
    <li
      ref={itemRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
      }}
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-card border border-zinc-200 bg-white py-3 pr-2 pl-4 shadow-popover',
        toast.tone === 'critical' && 'border-l-4 border-l-severity-critical',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && <p className="text-[13px] text-zinc-600">{toast.description}</p>}
        {toast.href && (
          <Link
            to={toast.href}
            onClick={onDismiss}
            className="mt-1 self-start text-[13px] font-medium underline underline-offset-2"
          >
            Aç
          </Link>
        )}
      </div>
      <IconButton
        label="Bildirimi kapat"
        onClick={() => {
          focusAfterClose(itemRef.current)
          onDismiss()
        }}
      >
        <CloseIcon size={16} />
      </IconButton>
    </li>
  )
}
