import { http, HttpResponse } from 'msw'
import { db } from '../db'
import { apiPath, authed } from '../utils'

/** Yalnızca admin (operatör -> 403). Ekranı FE-9'da; en yeni kayıt başta. */
export const auditLogHandlers = [
  http.get(
    apiPath('/audit-logs'),
    authed(() => HttpResponse.json([...db.auditLogs].reverse()), 'admin'),
  ),
]
