import { cn } from '@/lib/cn'
import type { ComponentProps } from 'react'
import { inputClass } from './inputStyles'

interface SelectProps extends ComponentProps<'select'> {
  label: string
}

/** Etiketli seçim kutusu. `Input` ile aynı görünüm ve etiket yerleşimi. */
export function Select({ label, className, children, ...rest }: SelectProps) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-[13px] text-zinc-500', className)}>
      {label}
      <select className={inputClass('lg')} {...rest}>
        {children}
      </select>
    </label>
  )
}
