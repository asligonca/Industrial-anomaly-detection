/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend taban adresi (/api öneki dahil), örn. http://localhost:8000/api */
  readonly VITE_API_URL: string
  /** "true" ise istekler MSW ile mock'lanır */
  readonly VITE_USE_MOCK: string
  /** Canlı alarm WebSocket adresi; boşsa API adresinden türetilir (`ws://host/ws/alarms`). */
  readonly VITE_WS_URL?: string
  /** "false" ise mock modda sahte olay üreten simülatör kapalı. */
  readonly VITE_MOCK_SIMULATOR?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
