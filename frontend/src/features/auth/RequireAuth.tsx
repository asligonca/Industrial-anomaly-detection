import { useAuthStore } from '@/store/auth'
import { Navigate, Outlet } from 'react-router-dom'

/** Oturum yoksa giriş ekranına yönlendirir. Oturum kapanınca (çıkış, 401) bileşen yeniden çizilir. */
export function RequireAuth() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}
