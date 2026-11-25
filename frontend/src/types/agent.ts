import type { AgentName } from './event-analysis'

/**
 * `GET /agents/status` yanıtı. **Şekil öneridir** (backend-notlari madde 20, Emre); mock bu şekle göre
 * çalışır. Bilinmeyen sayı `null` döner, arayüz o parçayı gizler (uydurma sayı yazılmaz).
 */

/** `idle`: bekliyor, `busy`: şu an bir olayı işliyor ("YANITLIYOR"), `down`: çalışmıyor. */
export type AgentState = 'idle' | 'busy' | 'down'

interface AgentBase<Name extends AgentName, Stats> {
  name: Name
  state: AgentState
  /** Kullanılan model (Gözcü: "yolo26n-exp1"); bilinmiyorsa `null`. */
  model: string | null
  stats: Stats
}

export type WatcherAgent = AgentBase<
  'watcher',
  {
    /** İzlenen (aktif) kamera akışı */
    streams: number | null
    fps: number | null
    ms_per_frame: number | null
  }
>

export type RegulationAgent = AgentBase<
  'regulation',
  {
    rules: number | null
    /** Aktif bölge */
    zones: number | null
  }
>

export type CoordinatorAgent = AgentBase<
  'coordinator',
  {
    /** Bugün (tesis saatiyle) verilen karar = bugünkü olay */
    decisions_today: number | null
  }
>

export type AgentStatus = WatcherAgent | RegulationAgent | CoordinatorAgent

export interface AgentsStatus {
  /** Hat sırasıyla: Gözcü -> İSG Mevzuat -> Koordinatör */
  agents: AgentStatus[]
  /** En son analiz edilen olay; hiç yoksa `null`. */
  last_decision: { event_id: number; at: string; total_ms: number } | null
}
