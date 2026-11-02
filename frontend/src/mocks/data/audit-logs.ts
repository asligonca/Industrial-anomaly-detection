import type { AuditLog } from '@/types'
import { today } from './time'

export const auditLogs: AuditLog[] = [
  {
    id: 1,
    user: 'sistem',
    text: 'Eski kare görüntüleri temizlendi',
    created_at: today('08:30:00'),
  },
  { id: 2, user: 'operator1', text: 'Oturum açıldı', created_at: today('08:47:00') },
  { id: 3, user: 'admin', text: 'KAM-06 kamerası yapılandırıldı', created_at: today('09:04:00') },
  { id: 4, user: 'operator1', text: 'OLY-010 olayı kapatıldı', created_at: today('09:12:00') },
]
