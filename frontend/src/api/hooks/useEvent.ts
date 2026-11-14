import { useQuery } from '@tanstack/react-query'
import { ApiError } from '../client'
import { getEvent } from '../events'
import { queryKeys } from '../queryKeys'

/** Tek olay. `id` null ise (adres geçersiz) istek atılmaz. */
export function useEvent(id: number | null) {
  return useQuery({
    queryKey: queryKeys.events.detail(id ?? -1),
    queryFn: ({ signal }) => getEvent(id!, signal),
    enabled: id !== null,
    // Olay yoksa (404) tekrar denemenin anlamı yok.
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 1,
  })
}
