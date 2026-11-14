import { Button } from './Button'

interface ErrorBoxProps {
  message: string
  /** Verilirse "Tekrar dene" düğmesi çıkar (genelde `query.refetch`). */
  onRetry?: () => void
}

/** Veri yüklenemediğinde gösterilen hata kutusu. */
export function ErrorBox({ message, onRetry }: ErrorBoxProps) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-danger/30 bg-status-open px-5 py-4"
    >
      <p className="text-sm text-status-open-ink">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Tekrar dene
        </Button>
      )}
    </div>
  )
}
