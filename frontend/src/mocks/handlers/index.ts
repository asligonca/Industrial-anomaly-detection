import { assistantHandlers } from './assistant'
import { auditLogHandlers } from './audit-logs'
import { authHandlers } from './auth'
import { cameraHandlers } from './cameras'
import { eventHandlers } from './events'
import { zoneHandlers } from './zones'

export const handlers = [
  ...authHandlers,
  ...cameraHandlers,
  ...zoneHandlers,
  ...eventHandlers,
  ...assistantHandlers,
  ...auditLogHandlers,
]
