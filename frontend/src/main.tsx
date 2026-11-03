import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { config } from './config'
import { initAuth } from './features/auth/session'
import './index.css'
import { queryClient } from './queryClient'
import { router } from './router'

/**
 * Mock açıksa MSW'yi ilk render'dan ÖNCE başlatır; yoksa ilk istekler gerçek ağa kaçar.
 * Dinamik import: mock kodu ayrı bir parçaya (chunk) düşer, mock kapalıyken hiç indirilmez.
 */
async function enableMocking() {
  if (!config.useMock) return
  const { worker } = await import('./mocks/browser')
  // Handler'ı olmayan istekler (görseller, Vite dosyaları) sessizce gerçek ağa gider.
  await worker.start({ onUnhandledFrame: 'bypass' })
}

initAuth()

enableMocking()
  .catch((error) => {
    // Mock başlamazsa uygulama yine açılır; istekler gerçek ağa gider ve hata ekranda görünür.
    console.error('[mock] MSW başlatılamadı', error)
  })
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>,
    )
  })
