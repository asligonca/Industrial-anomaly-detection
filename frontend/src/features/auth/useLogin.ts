import { login } from '@/api/auth'
import { ApiError } from '@/api/client'
import type { Role } from '@/types'
import { useMutation } from '@tanstack/react-query'

export const LOGIN_ERROR = 'Kullanıcı adı veya parola hatalı.'

interface LoginVariables {
  username: string
  password: string
  /** Seçili sekme. Hesabın gerçek rolüyle uyuşmazsa giriş reddedilir. */
  role: Role
}

/**
 * Sekme yalnızca ön yüz seçimidir; yetkiyi sunucunun döndürdüğü `user.role` belirler.
 * Rol sekmeyle uyuşmuyorsa oturum AÇILMAZ ve yanlış parola ile aynı hata gösterilir.
 *
 * Oturumu burada (mutation seviyesinde) açmıyoruz: `reset()` bekleyen girişi iptal etmez,
 * mutation seviyesindeki `onSuccess` yine çalışır ve kullanıcı terk ettiği sekmenin rolüyle girerdi.
 * `mutate(vars, { onSuccess })` ile verilen callback ise `reset()`'ten sonra çalışmaz.
 */
export function useLogin() {
  return useMutation({
    mutationFn: async ({ username, password, role }: LoginVariables) => {
      const result = await login({ username, password })
      if (result.user.role !== role) throw new ApiError(401, LOGIN_ERROR)
      return result
    },
  })
}

/** Forma yazılacak hata metni. Sunucuya ulaşılamıyorsa bunu ayrıca söyler. */
export function loginErrorMessage(error: Error): string {
  if (error instanceof ApiError && error.status !== 401) return error.message
  return LOGIN_ERROR
}
