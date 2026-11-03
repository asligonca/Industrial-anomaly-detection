import { cn } from '@/lib/cn'
import { useId, type ComponentProps } from 'react'

interface InputProps extends ComponentProps<'input'> {
  label: string
  /** Alan hatası. Verilirse alan `aria-invalid` olur ve mesaj ekran okuyucuya duyurulur. */
  error?: string
}

/** Etiketli metin alanı. Etiket görünür ve alana bağlıdır (tıklayınca odaklanır). */
export function Input({ label, error, className, ...rest }: InputProps) {
  const errorId = useId()
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="flex flex-col gap-1.5 text-[13px] text-zinc-500">
        {label}
        <input
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-11 rounded-control border border-zinc-300 bg-white px-3.5 text-[15px] text-zinc-900 focus-visible:border-zinc-900 aria-[invalid=true]:border-danger"
          {...rest}
        />
      </label>
      {error && (
        <span id={errorId} role="alert" className="text-[13px] text-danger">
          {error}
        </span>
      )}
    </div>
  )
}
