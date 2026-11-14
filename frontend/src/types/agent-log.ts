/** `agent_logs` tablosunun Read şeması. */
export interface AgentLog {
  id: number
  user_id: number
  query: string
  response: string
  created_at: string
}

/** `POST /assistant/query` gövdesi */
export interface AssistantQuery {
  query: string
}

/**
 * Asistanın önerdiği işlem. **Yalnızca öneri:** uygulanmaz; kullanıcı onaylarsa ön yüz
 * `PATCH /events/{id}/status` çağırır. `acknowledge_alarm` onaylanınca olay `reviewing` olur.
 */
export interface AssistantAction {
  type: 'acknowledge_alarm'
  event_id: number
}

/** `POST /assistant/query` yanıtı. */
export interface AssistantResponse {
  answer: string
  actions: AssistantAction[]
}
