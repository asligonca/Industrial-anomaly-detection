import type { AssistantQuery, AssistantResponse } from '@/types'
import { apiRequest } from './client'

export function queryAssistant(body: AssistantQuery) {
  return apiRequest<AssistantResponse>('/assistant/query', { method: 'POST', json: body })
}
