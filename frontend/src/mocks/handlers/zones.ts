import { http, HttpResponse } from 'msw'
import { db } from '../db'
import { apiPath, authed } from '../utils'

export const zoneHandlers = [
  http.get(
    apiPath('/zones'),
    authed(() => HttpResponse.json(db.zones)),
  ),
]
