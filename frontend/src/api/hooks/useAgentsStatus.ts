import { useQuery } from '@tanstack/react-query'
import { getAgentsStatus } from '../agents'
import { isNotFound } from '../client'
import { queryKeys } from '../queryKeys'

/** Bir ajan meşgulken ("YANITLIYOR") bu aralıkla yenilenir ki iş bitince etiket kalksın. */
const BUSY_REFETCH_MS = 15_000

/**
 * Ajan hattının durumu. Canlı alarm mesajında yenilenir (`useAlarmSocket`); meşgul ajan varken
 * ayrıca 15 sn'de bir. 404: uç backend'de henüz yok; tekrar denenmez.
 */
export function useAgentsStatus() {
  return useQuery({
    queryKey: queryKeys.agents.status,
    queryFn: ({ signal }) => getAgentsStatus(signal),
    retry: (count, error) => !isNotFound(error) && count < 1,
    refetchInterval: (query) =>
      query.state.data?.agents.some((agent) => agent.state === 'busy') ? BUSY_REFETCH_MS : false,
  })
}
