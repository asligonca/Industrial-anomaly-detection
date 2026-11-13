import { assistantHandlers } from './assistant'
import { auditLogHandlers } from './audit-logs'
import { authHandlers } from './auth'
import { cameraHandlers } from './cameras'
import { eventHandlers } from './events'
import { userHandlers } from './users'
import { zoneHandlers } from './zones'

export const handlers = [
  ...authHandlers,
  ...cameraHandlers,
  ...zoneHandlers,
  ...eventHandlers,
  ...assistantHandlers,
  ...userHandlers,
  ...auditLogHandlers,
]
