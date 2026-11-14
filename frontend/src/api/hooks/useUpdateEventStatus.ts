import type { EventStatusUpdate } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isConflict } from '../client'
import { updateEventStatus } from '../events'
import { queryKeys } from '../queryKeys'
import { invalidateWithAudit } from './invalidateWithAudit'

/**
 * Olay durumunu değiştirir. Backend izin vermediği geçişte 409 döner (olay bu arada başka biri
 * tarafından değiştirilmiş olabilir): ekrandaki durum eski, olaylar yeniden çekilir.
 */
export function useUpdateEventStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...update }: EventStatusUpdate & { id: number }) =>
      updateEventStatus(id, update),
    // Liste ve istatistikler eskidi: hepsini (ve denetim kayıtlarını) yeniden çek.
    onSuccess: () => invalidateWithAudit(queryClient, queryKeys.events.all),
    onError: (error) => {
      if (isConflict(error)) {
        return queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
      }
    },
  })
}
