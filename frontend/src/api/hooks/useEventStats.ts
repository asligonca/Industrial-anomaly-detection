import type { EventStatsRange } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { getEventStats } from '../events'
import { queryKeys } from '../queryKeys'

export function useEventStats(range: EventStatsRange = {}) {
  return useQuery({
    queryKey: queryKeys.events.stats(range),
    queryFn: ({ signal }) => getEventStats(range, signal),
  })
}
