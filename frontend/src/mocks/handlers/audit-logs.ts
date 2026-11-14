import { http, HttpResponse } from 'msw'
import { db } from '../db'
import { apiPath, authed, paginate, readPage } from '../utils'

/** Yalnızca admin (operatör -> 403). En yeni kayıt başta, sayfalı. */
export const auditLogHandlers = [
  http.get(
    apiPath('/audit-logs'),
    authed(({ request }) => {
      const page = readPage(new URL(request.url).searchParams)
      if (page instanceof Response) return page
      return HttpResponse.json(paginate([...db.auditLogs].reverse(), page))
    }, 'admin'),
  ),
]
