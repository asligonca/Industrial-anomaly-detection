import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseRecordsFilters, writeRecordsFilters, type RecordsFilters } from './recordsFilters'

/**
 * Kayıtlar filtrelerini adres çubuğundan okur ve yazar. `update` sayfa vermezse 1. sayfaya
 * döner: filtre değişince eski sayfa numarası anlamsızdır. Geçmişe yeni kayıt eklemez (`replace`),
 * böylece "geri" her harfte değil, önceki ekrana döner.
 */
export function useRecordsFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseRecordsFilters(params), [params])

  const update = useCallback(
    (patch: Partial<RecordsFilters>) =>
      setParams(
        (prev) => writeRecordsFilters({ ...parseRecordsFilters(prev), page: 1, ...patch }),
        { replace: true },
      ),
    [setParams],
  )

  return { filters, update }
}
