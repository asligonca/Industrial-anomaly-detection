import { cn } from '@/lib/cn'
import { buttonVariants } from './buttonStyles'

export interface FilterOption<T extends string> {
  value: T
  label: string
}

interface FilterChipsProps<T extends string> {
  /** Ekran okuyucu için grubun adı ("Kamera grubu"). */
  label: string
  options: readonly FilterOption<T>[]
  value: T
  onChange: (value: T) => void
}

/** Tek seçimli hap düğmeler (Tümü / Üretim / Depo ...). Seçili olan koyu görünür. */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              // Seçili: birincil düğme, değil: ikincil düğme renkleri. Kenarlık ikisinde de var ki
              // seçim değişince yükseklik kaymasın.
              'h-[38px] rounded-full border px-4 text-sm font-medium whitespace-nowrap',
              selected ? 'border-zinc-900' : 'border-zinc-300',
              buttonVariants[selected ? 'primary' : 'secondary'],
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
