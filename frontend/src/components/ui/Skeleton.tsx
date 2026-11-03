import { cn } from '@/lib/cn'

/** Yükleniyor yer tutucusu. Boyutu `className` ile ver (`h-4 w-40`, `h-32`). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('rounded-lg bg-zinc-200 motion-safe:animate-pulse', className)}
    />
  )
}
