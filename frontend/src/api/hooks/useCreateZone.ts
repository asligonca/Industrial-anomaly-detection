import type { ZoneCreate } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createZone } from '../zones'
import { queryKeys } from '../queryKeys'
import { invalidateWithAudit } from './invalidateWithAudit'

export function useCreateZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (zone: ZoneCreate) => createZone(zone),
    onSuccess: () => invalidateWithAudit(queryClient, queryKeys.zones.all),
  })
}
