import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Backend CORS yalnızca http://localhost:5173'e izin verir.
  // Port doluysa sessizce başka porta geçmesin, hata versin.
  server: {
    port: 5173,
    strictPort: true,
  },
})
