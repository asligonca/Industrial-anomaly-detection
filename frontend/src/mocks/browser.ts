import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { simulateEventNow } from './handlers/alarms'

export const worker = setupWorker(...handlers)

declare global {
  interface Window {
    /** Yalnızca geliştirmede: konsoldan `__mockSimulateEvent()` ile anında yeni olay. */
    __mockSimulateEvent?: () => string | null
  }
}

if (import.meta.env.DEV) window.__mockSimulateEvent = simulateEventNow
