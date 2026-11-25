import { useQuery } from '@tanstack/react-query'
import { isNotFound } from '../client'
import { getEventAnalysis } from '../events'
import { queryKeys } from '../queryKeys'

/**
 * Olayın ajan analizi (Gözcü -> İSG Mevzuat -> Koordinatör). 404: analiz yok (ya da backend'de uç
 * henüz yok, backend-notlari madde 19); tekrar denenmez.
 */
export function useEventAnalysis(id: number | null) {
  return useQuery({
    queryKey: queryKeys.events.analysis(id ?? -1),
    queryFn: ({ signal }) => getEventAnalysis(id!, signal),
    enabled: id !== null,
    retry: (count, error) => !isNotFound(error) && count < 1,
  })
}
