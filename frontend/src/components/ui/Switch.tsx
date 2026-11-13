import { cn } from '@/lib/cn'
import type { ComponentProps } from 'react'

interface SwitchProps extends Omit<ComponentProps<'button'>, 'onClick' | 'role' | 'type'> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /**
   * Kayıt sürüyor: tıklama yok sayılır. `disabled` kullanılmaz, çünkü devre dışı düğme odağı
   * kaybeder; klavyeyle çalışan kullanıcının odağı yerinde kalsın.
   */
  busy?: boolean
}

/**
 * Aç / kapat anahtarı. Ekran okuyucu "anahtar, açık / kapalı" diye okur. Neyi açıp kapattığı
 * `aria-label` ile söylenir (görünür etiket yoksa zorunlu).
 */
export function Switch({
  checked,
  onCheckedChange,
  busy = false,
  className,
  ...rest
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={busy || undefined}
      onClick={() => {
        if (!busy) onCheckedChange(!checked)
      }}
      className={cn(
        'relative inline-flex h-[26px] w-11 shrink-0 rounded-full transition-colors aria-disabled:cursor-wait motion-reduce:transition-none',
        // Kapalıyken tasarımdaki açık gri; çerçeve, anahtarın beyaz zeminde seçilmesi için (3:1).
        checked ? 'bg-zinc-900' : 'bg-zinc-300 ring-1 ring-zinc-500 ring-inset',
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-[3px] left-[3px] size-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none',
          checked && 'translate-x-[18px]',
        )}
      />
    </button>
  )
}
