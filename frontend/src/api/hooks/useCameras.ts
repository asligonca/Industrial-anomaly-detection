import { useQuery } from '@tanstack/react-query'
import { getCameras } from '../cameras'
import { queryKeys } from '../queryKeys'

export function useCameras() {
  return useQuery({
    queryKey: queryKeys.cameras.all,
    queryFn: ({ signal }) => getCameras(signal),
  })
}
