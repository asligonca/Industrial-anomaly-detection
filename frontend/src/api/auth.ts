import type { LoginRequest, LoginResponse } from '@/types'
import { apiRequest } from './client'

/** FastAPI OAuth2 kalıbı: form-encoded username/password. */
export function login(credentials: LoginRequest) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    form: { username: credentials.username, password: credentials.password },
    // Yanlış parola 401 döner: bu oturumu kapatmaz, formda hata olarak gösterilir.
    skipUnauthorizedHandler: true,
  })
}
