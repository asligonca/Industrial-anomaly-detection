import { cn } from '@/lib/cn'

/**
 * Metin alanı boyutu. `lg`: form alanı (giriş ekranı, `Input`). `md`: düğmelerle aynı satırdaki
 * alan (arama, durum notu; 42 px, `md` düğmeyle aynı boy). `sm`: sıkışık alan (tarih seçici).
 */
export type InputSize = 'sm' | 'md' | 'lg'

const sizes: Record<InputSize, string> = {
  sm: 'h-[38px] px-2.5 text-[13px]',
  md: 'h-[42px] px-3.5 text-sm',
  lg: 'h-11 px-3.5 text-[15px]',
}

/**
 * Tüm `<input>`'ların ortak görünümü: çerçeve, odakta koyulaşma, devre dışı ve hata hali.
 * `Input` bileşeni ve etiketi görünmeyen alanlar (arama kutusu gibi) aynı sınıfları buradan alır.
 * `className` yalnızca yerleşim içindir (genişlik, `flex`), görünümü ezmek için değil.
 */
export function inputClass(size: InputSize, className?: string): string {
  return cn(
    'rounded-control border border-zinc-300 bg-white text-zinc-900 focus-visible:border-zinc-900 disabled:opacity-60 aria-[invalid=true]:border-danger',
    sizes[size],
    className,
  )
}
