import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { PageQuery } from '../pageQuery'
import { queryKeys } from '../queryKeys'
import { getUsers } from '../users'

export function useUsers(page: PageQuery) {
  return useQuery({
    queryKey: queryKeys.users.list(page),
    queryFn: ({ signal }) => getUsers(page, signal),
    // Sayfa değişirken eski sayfa ekranda kalır (liste boşalıp zıplamasın).
    placeholderData: keepPreviousData,
  })
}
