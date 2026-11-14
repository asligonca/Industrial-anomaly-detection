/**
 * `GET /events/{id}/analysis` yanıtı: olayı işleyen ajanların sırayla verdiği kararlar.
 * Şekil öneridir; ajan tarafında kesinleşecek (FE-12 #25).
 */

/** Gözcü (görüntü), İSG Mevzuat (kural eşleştirme), Koordinatör (karar ve öneri). */
export type AgentName = 'watcher' | 'regulation' | 'coordinator'

export interface AgentStep {
  agent: AgentName
  /** Adımın bittiği an (ISO) */
  at: string
  text: string
}

export interface EventAnalysis {
  event_id: number
  steps: AgentStep[]
  /** Tüm adımların toplam süresi (ms) */
  total_ms: number
}
