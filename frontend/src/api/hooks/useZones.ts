import { useQuery } from '@tanstack/react-query'
import { getZones } from '../zones'
import { queryKeys } from '../queryKeys'

export function useZones() {
  return useQuery({
    queryKey: queryKeys.zones.all,
    queryFn: async ({ signal }) => (await getZones(signal)).items,
  })
}
