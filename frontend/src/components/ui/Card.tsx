import { cn } from '@/lib/cn'
import type { ComponentProps } from 'react'

interface CardProps extends ComponentProps<'div'> {
  /** `card`: 16 px (liste/ızgara kartı). `panel`: 20 px (giriş gibi tek başına duran yüzey). */
  radius?: 'card' | 'panel'
  padding?: 'none' | 'md' | 'lg'
}

const radii = { card: 'rounded-card', panel: 'rounded-panel' }
const paddings = { none: '', md: 'p-5', lg: 'p-9' }

/** Beyaz zeminli, ince çerçeveli yüzey. */
export function Card({ radius = 'card', padding = 'md', className, ...rest }: CardProps) {
  return (
    <div
      className={cn('border border-zinc-200 bg-white', radii[radius], paddings[padding], className)}
      {...rest}
    />
  )
}
