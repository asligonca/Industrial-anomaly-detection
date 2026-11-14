import type { UserCreate } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../queryKeys'
import { createUser } from '../users'
import { invalidateWithAudit } from './invalidateWithAudit'

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (user: UserCreate) => createUser(user),
    onSuccess: () => invalidateWithAudit(queryClient, queryKeys.users.all),
  })
}
