import type { EventStatusUpdate } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isConflict } from '../client'
import { updateEventStatus } from '../events'
import { queryKeys } from '../queryKeys'

/**
 * Olay durumunu değiştirir. Yanıt güncel olay detayı: detay önbelleğe doğrudan yazılır (ayrı GET
 * yok), listeler, istatistikler ve denetim kayıtları yenilenir. Backend izin vermediği geçişte 409
 * döner (olay bu arada başka biri tarafından değiştirilmiş olabilir): olaylar yeniden çekilir.
 */
export function useUpdateEventStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...update }: EventStatusUpdate & { id: number }) =>
      updateEventStatus(id, update),
    onSuccess: (detail) => {
      queryClient.setQueryData(queryKeys.events.detail(detail.id), detail)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.events.lists }),
        queryClient.invalidateQueries({ queryKey: queryKeys.events.allStats }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs.all }),
      ])
    },
    onError: (error) => {
      if (isConflict(error)) {
        return queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
      }
    },
  })
}
