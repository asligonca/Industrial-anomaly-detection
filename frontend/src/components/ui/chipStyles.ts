import { cn } from '@/lib/cn'
import { buttonVariants } from './buttonStyles'

/** `md` 38 px (filtre çipleri), `sm` 30 px (asistan önerileri gibi sıkışık yerler). */
export type ChipSize = 'sm' | 'md'

const sizes: Record<ChipSize, string> = {
  sm: 'h-[30px] px-3 text-xs',
  md: 'h-[38px] px-4 text-sm font-medium',
}

/**
 * Hap biçimli düğme. Seçili: birincil, değil: ikincil düğme renkleri. Kenarlık ikisinde de var ki
 * seçim değişince yükseklik kaymasın. `className` yalnızca yerleşim için.
 */
export function chipClass(size: ChipSize, selected = false, className?: string): string {
  return cn(
    'rounded-full border whitespace-nowrap aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
    selected ? 'border-zinc-900' : 'border-zinc-300',
    buttonVariants[selected ? 'primary' : 'secondary'],
    sizes[size],
    className,
  )
}
