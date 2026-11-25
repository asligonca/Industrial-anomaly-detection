import { ToastViewport } from '@/components/ui/Toast'
import { useAlarmSocket } from '@/features/alarms/useAlarmSocket'
import { AssistantDock } from '@/features/assistant/AssistantDock'
import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'

/**
 * Girişli kullanıcının tüm sayfalarını saran kabuk: üst bar, içerik alanı, sesli asistan,
 * bildirimler. Canlı alarm bağlantısı burada bir kez açılır.
 */
export function AppShell() {
  useAlarmSocket()

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-[1360px] flex-1 px-6 pt-8 pb-28">
        <Outlet />
      </main>
      <AssistantDock />
      <ToastViewport />
    </div>
  )
}
