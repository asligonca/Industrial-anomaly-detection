import { setTokenProvider, setUnauthorizedHandler } from '@/api/client'
import { queryClient } from '@/queryClient'
import { useAuthStore } from '@/store/auth'
import { useUiStore } from '@/store/ui'
import type { SessionUser } from '@/types'

/** Giriş: önceki kullanıcıdan kalan önbellek yeni oturuma karışmasın diye temizlenir. */
export function startSession(token: string, user: SessionUser) {
  queryClient.clear()
  useAuthStore.getState().setSession(token, user)
}

/** Çıkış (kullanıcı ya da 401): oturum silinir, önbellek temizlenir. Guard `/login`'e yönlendirir. */
export function endSession() {
  useAuthStore.getState().clearSession()
  useUiStore.getState().closeAssistant()
  queryClient.clear()
}

/** Uygulama açılırken bir kez çağrılır: API istemcisini auth store'a bağlar. */
export function initAuth() {
  setTokenProvider(() => useAuthStore.getState().token)
  // Eski token'la gitmiş bir isteğin geç gelen 401'i, sonradan açılan yeni oturumu kapatmasın.
  setUnauthorizedHandler((sentToken) => {
    if (useAuthStore.getState().token === sentToken) endSession()
  })
}
