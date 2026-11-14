import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryAssistant } from '../assistant'
import { queryKeys } from '../queryKeys'

export function useAssistantQuery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (query: string) => queryAssistant({ query }),
    onSuccess: (data) => {
      // Asistan bir alarmı kapattıysa olay listesi değişti.
      if (data.actions.some((a) => a.type === 'acknowledge_alarm')) {
        return queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
      }
    },
  })
}
