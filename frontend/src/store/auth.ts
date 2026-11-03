import type { Role, User } from '@/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  user: User | null
  /** Son giriş yapan rol. Çıkıştan sonra giriş ekranı bu sekmeyle açılır. */
  lastRole: Role | null
  setSession: (token: string, user: User) => void
  clearSession: () => void
}

/**
 * Oturum bilgisi. localStorage'a yazılır, sayfa yenilense de giriş korunur.
 * Önbellek temizliği burada değil `features/auth/session.ts` içinde (store, queryClient'ı bilmez).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      lastRole: null,
      setSession: (token, user) => set({ token, user, lastRole: user.role }),
      // lastRole bilerek silinmez: çıkıştan sonra giriş sekmesi hatırlansın.
      clearSession: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth',
      // Yalnızca veriyi sakla, fonksiyonları değil.
      partialize: (state) => ({ token: state.token, user: state.user, lastRole: state.lastRole }),
    },
  ),
)
