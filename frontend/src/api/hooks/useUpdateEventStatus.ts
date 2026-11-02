import type { EventStatusUpdate } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateEventStatus } from '../events'
import { queryKeys } from '../queryKeys'

export function useUpdateEventStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...update }: EventStatusUpdate & { id: number }) =>
      updateEventStatus(id, update),
    // Liste ve istatistikler eskidi: hepsini yeniden çek.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
  })
}
