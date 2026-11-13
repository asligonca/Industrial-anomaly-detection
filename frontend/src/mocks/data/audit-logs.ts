import type { AuditLog } from '@/types'
import { today } from './time'

export const auditLogs: AuditLog[] = [
  {
    id: 1,
    user: { id: 2, username: 'operator1' },
    action: 'user.login',
    target_type: 'user',
    target_id: 2,
    details: { label: 'operator1' },
    created_at: today('08:47:00'),
  },
  {
    id: 2,
    user: { id: 1, username: 'admin' },
    action: 'camera.updated',
    target_type: 'camera',
    target_id: 6,
    details: { label: 'KAM-06' },
    created_at: today('09:04:00'),
  },
  {
    id: 3,
    user: { id: 2, username: 'operator1' },
    action: 'event.status_changed',
    target_type: 'event',
    target_id: 10,
    details: { label: 'OLY-010', from: 'reviewing', to: 'confirmed' },
    created_at: today('09:12:00'),
  },
]
