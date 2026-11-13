/** `users.role` */
export type Role = 'admin' | 'operator'

/** `users` tablosunun Read şeması. `password_hash` API'den hiç dönmez. */
export interface User {
  id: number
  username: string
  role: Role
  created_at: string
  /** FE-12 (#25) önerisi, backend onayı bekliyor. */
  last_login_at: string | null
}

/** Giriş yanıtındaki ve oturumda saklanan kullanıcı: yalnızca kimlik ve rol. */
export type SessionUser = Pick<User, 'id' | 'username' | 'role'>

/** Başka kayıtların içinde geçen kullanıcı (denetim kaydı, alarm işlemi). */
export type UserRef = Pick<User, 'id' | 'username'>

export interface UserCreate {
  username: string
  password: string
  role: Role
}

export type UserUpdate = Partial<UserCreate>

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  /** JWT içinde de `role` claim'i var. */
  user: SessionUser
}
