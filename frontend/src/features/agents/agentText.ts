import type { AgentState, AgentStatus } from '@/types'

/** Kartın rol satırı. Model adı yalnızca backend'den gelir; bilinmiyorsa yazılmaz, uydurulmaz. */
export function agentRole(agent: AgentStatus): string {
  switch (agent.name) {
    case 'watcher':
      return agent.model ? `Görüntü analizi · ${agent.model}` : 'Görüntü analizi'
    case 'regulation':
      return 'Kural eşleştirme · risk sınıfı'
    case 'coordinator':
      return agent.model ? `${agent.model} · function calling` : 'Karar ve öneri'
  }
}

const joinKnown = (parts: (string | false | null)[]) => parts.filter(Boolean).join(' · ')

/** Mono istatistik satırı; `null` sayılar gizlenir (uydurma sayı yazılmaz). Hiçbiri yoksa ''. */
export function agentStats(agent: AgentStatus): string {
  switch (agent.name) {
    case 'watcher': {
      const { streams, fps, ms_per_frame } = agent.stats
      return joinKnown([
        streams !== null && `${streams} akış`,
        fps !== null && `${fps} fps`,
        ms_per_frame !== null && `${ms_per_frame} ms/kare`,
      ])
    }
    case 'regulation': {
      const { rules, zones } = agent.stats
      return joinKnown([rules !== null && `${rules} kural`, zones !== null && `${zones} bölge`])
    }
    case 'coordinator': {
      const { decisions_today } = agent.stats
      return joinKnown([decisions_today !== null && `bugün ${decisions_today} karar`])
    }
  }
}

/** Durumun ekran okuyucu metni ve kartta görünen etiketi (boş: etiket yok). */
export const agentStateText: Record<AgentState, { label: string; badge: string }> = {
  idle: { label: 'Bekliyor', badge: '' },
  busy: { label: 'Yanıtlıyor', badge: 'YANITLIYOR' },
  down: { label: 'Çalışmıyor', badge: 'ÇALIŞMIYOR' },
}
