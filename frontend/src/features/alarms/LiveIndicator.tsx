import type { AlarmSocketStatus } from '@/types'
import { useAlarmStatusStore } from '@/store/alarmStatus'

const views: Record<AlarmSocketStatus, { dot: string; label: string; title: string }> = {
  open: { dot: 'bg-ok', label: 'Canlı', title: 'Yeni olaylar anında geliyor' },
  connecting: {
    dot: 'bg-zinc-300',
    label: 'Bağlanıyor',
    title: 'Canlı alarm akışına bağlanılıyor',
  },
  closed: {
    dot: 'bg-warn',
    label: 'Bağlantı yok',
    title: 'Canlı alarm akışı koptu; yeniden deneniyor. Liste kendiliğinden yenilenmez.',
  },
  unauthorized: {
    dot: 'bg-danger',
    label: 'Bağlantı yok',
    title: 'Canlı alarm akışı oturumu kabul etmedi. Yeniden giriş yapın.',
  },
}

/**
 * Üst barda canlı alarm bağlantısı. Dar ekranda yalnızca nokta görünür (yazı ekran okuyucuya
 * kalır); ayrıntı `title`'da. Telefonda (< 640 px) gizli: üst bar zaten taşıyor (FE-4).
 * Durum değişikliği duyurulmaz: bağlantı sık kopup gelebilir.
 */
export function LiveIndicator() {
  const status = useAlarmStatusStore((s) => s.status)
  const view = views[status]

  return (
    <div
      title={view.title}
      className="flex h-[34px] items-center gap-2 rounded-full border border-zinc-200 px-3 text-[13px] whitespace-nowrap text-zinc-600 max-[1349px]:px-2.5 max-sm:hidden"
    >
      <span aria-hidden className={`size-[7px] rounded-full ${view.dot}`} />
      <span className="max-[1349px]:sr-only">{view.label}</span>
      <span className="sr-only">{`: ${view.title}`}</span>
    </div>
  )
}
