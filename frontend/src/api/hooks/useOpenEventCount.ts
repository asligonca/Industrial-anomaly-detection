import { OPEN_STATUSES } from '@/lib/labels'
import { useEvents } from './useEvents'

/**
 * Açık (yeni + inceleniyor) olay sayısı. Menü rozeti için.
 * Yalnızca `total` lazım, bu yüzden tek kayıt istenir.
 * Yüklenirken ya da hata varsa `undefined` döner.
 */
export function useOpenEventCount() {
  const { data } = useEvents({ status: OPEN_STATUSES, limit: 1 })
  return data?.total
}
