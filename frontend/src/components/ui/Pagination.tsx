import { Button } from './Button'

interface PaginationProps {
  /** 1'den başlar. */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  /** Yeni sayfa yüklenirken düğmeler kilitlenir (çift tıklama iki sayfa atlamasın). */
  disabled?: boolean
}

/** "21–40 / 57" ve Önceki / Sonraki. Kayıt yoksa hiç görünmez. */
export function Pagination({ page, pageSize, total, onPageChange, disabled }: PaginationProps) {
  if (total === 0) return null

  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  const first = Math.min((page - 1) * pageSize + 1, total)
  const last = Math.min(page * pageSize, total)

  return (
    <nav aria-label="Sayfalama" className="flex flex-wrap items-center justify-between gap-3">
      <p className="font-mono text-[13px] text-zinc-500" aria-live="polite">
        {first}–{last} / {total}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Önceki
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Sonraki
        </Button>
      </div>
    </nav>
  )
}
