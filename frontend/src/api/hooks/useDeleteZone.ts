import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteZone } from '../zones'
import { queryKeys } from '../queryKeys'
import { invalidateWithAudit } from './invalidateWithAudit'

export function useDeleteZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteZone(id),
    onSuccess: () => invalidateWithAudit(queryClient, queryKeys.zones.all),
  })
}
