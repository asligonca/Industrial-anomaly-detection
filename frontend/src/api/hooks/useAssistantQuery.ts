import { useMutation } from '@tanstack/react-query'
import { queryAssistant } from '../assistant'

/**
 * Asistana soru sorar. Yanıttaki `actions` yalnızca öneridir; asistan hiçbir şeyi değiştirmez,
 * bu yüzden önbellek yenilenmez. Öneri onaylanınca `useUpdateEventStatus` çalışır.
 */
export function useAssistantQuery() {
  return useMutation({
    mutationFn: (query: string) => queryAssistant({ query }),
  })
}
