import { Outlet } from 'react-router-dom'
import { AssistantButton } from './AssistantButton'
import { TopBar } from './TopBar'

/** Girişli kullanıcının tüm sayfalarını saran kabuk: üst bar, içerik alanı, asistan düğmesi. */
export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-[1360px] flex-1 px-6 pt-8 pb-28">
        <Outlet />
      </main>
      <AssistantButton />
    </div>
  )
}
