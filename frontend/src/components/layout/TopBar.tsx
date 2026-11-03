import { Logo } from '@/components/Logo'
import { MainNav } from './MainNav'
import { OnlineIndicator } from './OnlineIndicator'
import { UserInfo } from './UserInfo'

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 flex-none items-center gap-6 border-b border-zinc-200 bg-white px-6">
      <div className="flex flex-none items-center gap-2.5">
        <Logo size={36} />
        <div>
          <div className="text-base leading-[1.1] font-bold tracking-[0.14em]">SAURON</div>
          <div className="text-[11px] text-zinc-500">Güvenlik Kontrol Merkezi</div>
        </div>
      </div>
      <MainNav />
      <div className="flex flex-none items-center gap-4">
        <OnlineIndicator />
        <UserInfo />
      </div>
    </header>
  )
}
