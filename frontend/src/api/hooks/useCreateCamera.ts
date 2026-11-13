import type { CameraCreate } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCamera } from '../cameras'
import { queryKeys } from '../queryKeys'
import { invalidateWithAudit } from './invalidateWithAudit'

export function useCreateCamera() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (camera: CameraCreate) => createCamera(camera),
    onSuccess: () => invalidateWithAudit(queryClient, queryKeys.cameras.all),
  })
}
