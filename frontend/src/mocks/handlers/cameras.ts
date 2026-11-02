import { http, HttpResponse } from 'msw'
import { db } from '../db'
import { apiPath, authed } from '../utils'

export const cameraHandlers = [
  http.get(
    apiPath('/cameras'),
    authed(() => HttpResponse.json(db.cameras)),
  ),
]
