/** `GET /audit-logs` satırı (yalnızca admin). FE-12 (#25) önerisi. */
export interface AuditLog {
  id: number
  /** İşlemi yapan kullanıcı adı ya da "sistem" */
  user: string
  text: string
  created_at: string
}
