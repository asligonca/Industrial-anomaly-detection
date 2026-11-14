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

/**
 * İkon düğmesi. `ghost`: çerçevesiz (panel başlığındaki ses / kapat), `outline`: çerçeveli (metin
 * alanının yanında), `alert`: kırmızı dolu (ör. dinlerken mikrofon). İkon `currentColor` kullanır.
 */
export type IconButtonVariant = 'ghost' | 'outline' | 'alert'
/** `sm` 36 px (başlık), `md` 42 px (`md` metin alanı ve düğmeyle aynı boy). */
export type IconButtonSize = 'sm' | 'md'

const iconVariants: Record<IconButtonVariant, string> = {
  ghost: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900',
  outline: 'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100',
  alert: 'border border-danger bg-danger text-white',
}

const iconSizes: Record<IconButtonSize, string> = {
  sm: 'size-9',
  md: 'size-[42px]',
}

export function iconButtonClass(
  variant: IconButtonVariant,
  size: IconButtonSize,
  className?: string,
): string {
  return cn(
    'grid flex-none place-items-center rounded-control disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
    iconVariants[variant],
    iconSizes[size],
    className,
  )
}
