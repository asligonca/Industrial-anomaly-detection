import type { User } from '@/types'
import { atDay, today } from './time'

export const users: User[] = [
  {
    id: 1,
    username: 'admin',
    role: 'admin',
    created_at: atDay(90, '10:00:00'),
    last_login_at: today('09:04:00'),
  },
  {
    id: 2,
    username: 'operator1',
    role: 'operator',
    created_at: atDay(60, '10:00:00'),
    last_login_at: today('08:47:00'),
  },
  {
    id: 3,
    username: 'operator2',
    role: 'operator',
    created_at: atDay(30, '10:00:00'),
    last_login_at: atDay(1, '22:10:00'),
  },
]

/**
 * Yalnızca mock'ta: gerçek API parolayı ya da hash'ini asla döndürmez. Backend kuralı en az 8
 * karakter; demo parolaları seed'deki gibi (backend-notlari madde 28).
 */
export const mockPasswords: Record<string, string> = {
  admin: 'admin1234',
  operator1: 'operator1234',
  operator2: 'operator1234',
}
