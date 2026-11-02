/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend taban adresi, örn. http://localhost:8000 */
  readonly VITE_API_URL: string
  /** "true" ise istekler MSW ile mock'lanır */
  readonly VITE_USE_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
