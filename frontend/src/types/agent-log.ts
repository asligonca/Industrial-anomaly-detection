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

/** Asistanın yanıtla birlikte yaptığı işlem. FE-12 (#25) önerisi. */
export interface AssistantAction {
  type: 'acknowledge_alarm'
  event_id: number
}

/** `POST /assistant/query` yanıtı. FE-12 (#25) önerisi. */
export interface AssistantResponse {
  answer: string
  actions: AssistantAction[]
}
