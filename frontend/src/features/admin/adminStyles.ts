import { cn } from '@/lib/cn'

/**
 * Yönetici listelerinin ortak görünümü (kameralar, bölgeler, kullanıcılar, denetim).
 * Kutu `overflow-hidden` almaz: içindeki düğmelerin odak halkası kesilmesin.
 */
export const adminListClass = 'rounded-card border border-zinc-200 bg-white'

/** Liste satırı. Izgara sütunları satırı kullanan bileşende verilir (`sm:grid-cols-[...]`). */
export function adminRowClass(className?: string): string {
  return cn('border-b border-zinc-100 px-5 py-3.5 text-sm last:border-b-0', className)
}

/** Liste boşken ya da sonuç yokken satır yerine çıkan yazı. */
export const adminEmptyClass = 'p-6 text-center text-sm text-zinc-500'

/** Satır içi kayıt hatası (kamera anahtarı, bölge silme). */
export const inlineErrorClass = 'text-[12px] text-danger'

/** Liste yüklenirken gösterilen yer tutucu satır sayısı. */
export const SKELETON_ROWS = 4

/** Kullanıcılar ve denetim kayıtları sayfa boyutu (Kayıtlar tablosuyla aynı). */
export const ADMIN_PAGE_SIZE = 20
