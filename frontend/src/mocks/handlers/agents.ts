import { isSameDay } from '@/lib/format'
import type { AgentsStatus } from '@/types'
import { http, HttpResponse } from 'msw'
import { buildEventAnalysis } from '../analysis'
import { db } from '../db'
import { MODEL_VERSION } from '../eventResponse'
import { apiPath, authed } from '../utils'

/** Son olay bu kadar yeniyse Koordinatör hâlâ onu işliyor sayılır ("YANITLIYOR"). */
const BUSY_WINDOW_MS = 60_000

/**
 * `GET /agents/status` (öneri, backend-notlari madde 20). Sayılar mock veritabanından hesaplanır;
 * veritabanında karşılığı olmayanlar (fps, ms/kare, kural sayısı) `null`: uydurma sayı yok.
 */
export const agentHandlers = [
  http.get(
    apiPath('/agents/status'),
    authed(() => {
      const now = new Date()
      const streams = db.cameras.filter((c) => c.is_active).length
      const zones = db.zones.filter((z) => z.is_active).length
      const newest = db.events.reduce<(typeof db.events)[number] | null>(
        (latest, e) => (!latest || e.created_at > latest.created_at ? e : latest),
        null,
      )
      const busy = newest !== null && now.getTime() - Date.parse(newest.created_at) < BUSY_WINDOW_MS

      const body: AgentsStatus = {
        agents: [
          {
            name: 'watcher',
            state: streams > 0 ? 'idle' : 'down',
            model: MODEL_VERSION,
            stats: { streams, fps: null, ms_per_frame: null },
          },
          { name: 'regulation', state: 'idle', model: null, stats: { rules: null, zones } },
          {
            name: 'coordinator',
            state: busy ? 'busy' : 'idle',
            model: null,
            stats: {
              decisions_today: db.events.filter((e) => isSameDay(new Date(e.created_at), now))
                .length,
            },
          },
        ],
        last_decision: newest && {
          event_id: newest.id,
          at: newest.created_at,
          total_ms: buildEventAnalysis(newest).total_ms,
        },
      }
      return HttpResponse.json(body)
    }),
  ),
]
