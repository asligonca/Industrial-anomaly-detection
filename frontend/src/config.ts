/** Ortam değişkenlerine tek noktadan erişim. */
export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
} as const
