import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-zinc-900 font-medium text-white hover:bg-zinc-700',
  secondary: 'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-[34px] rounded-lg px-3 text-[13px]',
  md: 'h-[42px] rounded-control px-[18px] text-sm',
  lg: 'h-[46px] rounded-control px-5 text-[15px]',
}

/** `Button` ve `LinkButton` aynı görünümü bu fonksiyondan alır. */
export function buttonClass(variant: ButtonVariant, size: ButtonSize, className?: string): string {
  return cn(
    'inline-flex items-center justify-center whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    sizes[size],
    className,
  )
}
