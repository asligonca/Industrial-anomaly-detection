import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

/** Düğme renkleri. `FilterChips` de seçili/seçili değil için bunları kullanır. */
export const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-zinc-900 font-medium text-white hover:bg-zinc-700',
  secondary: 'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100',
  /** Geri alınamayan işlem (Sil): çerçeveli, kırmızı yazı. */
  danger: 'border border-zinc-300 bg-white text-status-open-ink hover:bg-status-open',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-[34px] rounded-lg px-3 text-[13px]',
  md: 'h-[42px] rounded-control px-[18px] text-sm',
  lg: 'h-[46px] rounded-control px-5 text-[15px]',
}

/** `Button` ve `LinkButton` aynı görünümü bu fonksiyondan alır. */
export function buttonClass(variant: ButtonVariant, size: ButtonSize, className?: string): string {
  return cn(
    // `aria-disabled`: kayıt sürerken odak düğmede kalsın diye `disabled` yerine kullanılır,
    // görünümü aynı olmalı.
    'inline-flex items-center justify-center whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
    buttonVariants[variant],
    sizes[size],
    className,
  )
}
