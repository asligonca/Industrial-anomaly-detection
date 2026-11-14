import type { EventFilters } from '@/types'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getEvents } from '../events'
import { queryKeys } from '../queryKeys'

export function useEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: ({ signal }) => getEvents(filters, signal),
    // Sayfa/filtre değişince yeni veri gelene kadar eski liste ekranda kalır.
    placeholderData: keepPreviousData,
  })
}
