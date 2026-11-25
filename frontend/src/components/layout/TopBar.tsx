import { Logo } from '@/components/Logo'
import { LiveIndicator } from '@/features/alarms/LiveIndicator'
import { MainNav } from './MainNav'
import { OnlineIndicator } from './OnlineIndicator'
import { UserInfo } from './UserInfo'

/**
 * Üst bar. Telefonda (< 640 px) iki satır: üstte logo ve sağ küme, altta yatay kaydırılan menü
 * (tek satıra sığmıyordu, sayfa yatay taşıyordu).
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 flex-none items-center gap-6 border-b border-zinc-200 bg-white px-6 max-[1349px]:gap-4 max-[1349px]:px-4 max-sm:h-auto max-sm:flex-wrap max-sm:gap-y-1 max-sm:pt-2.5 max-sm:pb-1.5">
      <div className="flex flex-none items-center gap-2.5">
        <Logo size={36} />
        <div>
          <div className="text-base leading-[1.1] font-bold tracking-[0.14em]">SENTRA</div>
          {/* Dar ekranda menüye yer açmak için gizlenir (ekran okuyucuya kalır). */}
          <div className="text-[11px] text-zinc-500 max-[1449px]:sr-only">
            Endüstriyel İzleme Merkezi
          </div>
        </div>
      </div>
      <MainNav />
      <div className="flex flex-none items-center gap-4 max-sm:ml-auto max-sm:gap-2.5">
        <LiveIndicator />
        <OnlineIndicator />
        <UserInfo />
      </div>
    </header>
  )
}
