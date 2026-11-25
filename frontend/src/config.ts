const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

/**
 * Canlı alarm adresi. WS yolu `/api` öneksiz (sözleşme): `http://host:8000/api` ->
 * `ws://host:8000/ws/alarms`. Farklıysa `VITE_WS_URL` ile verilir.
 */
function alarmSocketUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  const url = new URL(apiUrl, window.location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = `${url.pathname.replace(/\/$/, '').replace(/\/api$/, '')}/ws/alarms`
  url.search = ''
  return url.href
}

/** Ortam değişkenlerine tek noktadan erişim. */
export const config = {
  apiUrl,
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  wsUrl: alarmSocketUrl(),
  /** Mock modda sahte olay simülatörü; yalnızca `VITE_MOCK_SIMULATOR=false` kapatır. */
  mockSimulator: import.meta.env.VITE_MOCK_SIMULATOR !== 'false',
} as const
