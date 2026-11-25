import { cn } from '@/lib/cn'
import { useToastStore, type Toast } from '@/store/toasts'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconButton } from './Button'
import { CloseIcon } from './icons'

/** Bildirim bu kadar sonra kendiliğinden kalkar; üstündeyken (fare ya da odak) süre durur. */
const TOAST_DURATION_MS = 10_000

/**
 * Bildirimlerin göründüğü alan: üst barın altında, sağda. Liste her zaman çizilir (boşken de) ki
 * `aria-live` yeni bildirimi okusun.
 */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <section
      aria-label="Bildirimler"
      className="pointer-events-none fixed top-20 right-4 z-40 w-[min(360px,calc(100vw-2rem))]"
    >
      <ol aria-live="polite" className="flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </ol>
    </section>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss)
  // Kararlı: başka bildirim gelince bu bildirimin süresi baştan başlamasın.
  const onDismiss = useCallback(() => dismiss(toast.id), [dismiss, toast.id])
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
      <IconButton label="Bildirimi kapat" onClick={onDismiss}>
        <CloseIcon size={16} />
      </IconButton>
    </li>
  )
}
