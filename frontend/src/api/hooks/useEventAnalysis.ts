import { useQuery } from '@tanstack/react-query'
import { getEventAnalysis } from '../events'
import { queryKeys } from '../queryKeys'

/** Olayın ajan analizi (Gözcü -> İSG Mevzuat -> Koordinatör). */
export function useEventAnalysis(id: number | null) {
  return useQuery({
    queryKey: queryKeys.events.analysis(id ?? -1),
    queryFn: ({ signal }) => getEventAnalysis(id!, signal),
    enabled: id !== null,
  })
}
