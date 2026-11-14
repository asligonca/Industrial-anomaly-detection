import type { Role } from '@/types'

export interface NavItem {
  to: string
  label: string
  /** Yalnızca tam eşleşmede aktif ("/" her adresin başı olduğu için) */
  end?: boolean
  /** Etiketin yanında açık olay sayısı rozeti gösterilir */
  openEventBadge?: boolean
  /** Bu role sahip olmayanlar görmez */
  role?: Role
}

/** Menü sırası tasarımdaki gibi. Admin maddeleri operatör maddelerinin ardından gelir. */
export const navItems: NavItem[] = [
  { to: '/', label: 'Canlı izleme', end: true },
  { to: '/events', label: 'Olaylar', openEventBadge: true },
  { to: '/records', label: 'Kayıtlar' },
  { to: '/agents', label: 'Ajan akışı' },
  { to: '/admin/cameras', label: 'Kameralar ve bölgeler', role: 'admin' },
  { to: '/admin/users', label: 'Kullanıcılar', role: 'admin' },
  { to: '/admin/audit', label: 'Denetim kayıtları', role: 'admin' },
]
