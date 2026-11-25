import { queryKeys } from '@/api/queryKeys'
import { config } from '@/config'
import { eventCode, eventTypeLabel } from '@/lib/labels'
import { useAuthStore } from '@/store/auth'
import { useToastStore } from '@/store/toasts'
import type { AlarmMessage } from '@/types'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAlarmStatusStore } from '@/store/alarmStatus'

/** Yeniden bağlanma beklemesi: 1, 2, 4 ... sn, en çok 30 sn. */
const RETRY_BASE_MS = 1_000
const RETRY_MAX_MS = 30_000

/**
 * Backend token geçersizse bağlantıyı bu kodla kapatır (WebSocket'te HTTP 401 yok). 1008 (policy
 * violation) da aynı anlamda kabul edilir. Bu kodlarda yeniden denenmez: REST isteği 401 alıp
 * oturumu zaten kapatır.
 */
const UNAUTHORIZED_CLOSE_CODES = new Set([4401, 1008])

function parseMessage(raw: unknown): AlarmMessage | null {
  if (typeof raw !== 'string') return null
  try {
    const message = JSON.parse(raw) as Partial<AlarmMessage>
    const known = message.type === 'event.created' || message.type === 'event.updated'
    return known && typeof message.data?.id === 'number' ? (message as AlarmMessage) : null
  } catch {
    return null
  }
}

function notifyNewEvent({ data: event }: AlarmMessage) {
  useToastStore.getState().push({
    title: `Yeni olay · ${eventCode(event.id)}`,
    description: `${eventTypeLabel(event.type)} · ${event.camera.name}`,
    href: `/events/${event.id}`,
    tone: event.severity === 'critical' ? 'critical' : 'info',
  })
}

/**
 * Olaylarla ilgili bütün sorgular (liste, açık sayaç, istatistik, detay) `['events']` altında:
 * hepsi yenilenir. Analiz değişmez ama ucuz; ayrı tutmaya değmez. Ajan hattı (son karar) da.
 */
function refreshEvents(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.agents.all }),
  ])
}

/**
 * Canlı alarm akışı: `WS /ws/alarms?token=<JWT>` (`/api` öneksiz). Oturum varken açık tutulur,
 * koparsa artan beklemeyle yeniden bağlanır. Mesajda olay sorguları yenilenir; yeni olayda
 * bildirim çıkar. Yeniden bağlanınca da yenilenir (kopukken gelen mesajlar kaçmış olabilir).
 * Uygulamada bir kez, `AppShell`'de çağrılır.
 */
export function useAlarmSocket() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const setStatus = useAlarmStatusStore((s) => s.setStatus)

  useEffect(() => {
    if (!token) return
    let socket: WebSocket | null = null
    let retryTimer: number | undefined
    let attempt = 0
    let stopped = false

    const connect = () => {
      setStatus('connecting')
      const url = new URL(config.wsUrl)
      url.searchParams.set('token', token)
      socket = new WebSocket(url)

      socket.addEventListener('open', () => {
        if (attempt > 0) void refreshEvents(queryClient)
        attempt = 0
        setStatus('open')
      })

      socket.addEventListener('message', (event) => {
        const message = parseMessage(event.data)
        if (!message) return
        void refreshEvents(queryClient)
        if (message.type === 'event.created') notifyNewEvent(message)
      })

      socket.addEventListener('close', (event) => {
        if (stopped) return
        if (UNAUTHORIZED_CLOSE_CODES.has(event.code)) {
          setStatus('unauthorized')
          return
        }
        setStatus('closed')
        const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** attempt)
        attempt += 1
        retryTimer = window.setTimeout(connect, delay)
      })
    }

    connect()
    return () => {
      stopped = true
      window.clearTimeout(retryTimer)
      socket?.close(1000)
      setStatus('connecting')
    }
  }, [token, queryClient, setStatus])
}
