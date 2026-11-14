import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { useAuthStore } from '@/store/auth'
import type { Role } from '@/types'
import { Outlet } from 'react-router-dom'

/** Rol yetmiyorsa yönlendirmez, "Yetkiniz bulunmamaktadır" ekranını gösterir. */
export function RequireRole({ role }: { role: Role }) {
  const userRole = useAuthStore((s) => s.user?.role)
  if (userRole !== role) return <ForbiddenPage />
  return <Outlet />
}
