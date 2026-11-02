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
  /** Backend döndürmezse FE-3 bunu ayrı bir istekle alır. */
  user: User
}
