import { eventCode, eventTypeLabel, isOpenStatus } from '@/lib/labels'
import type { AnomalyEvent, AssistantResponse, User } from '@/types'
import { http, HttpResponse } from 'msw'
import { addAgentLog, db, setEventStatus } from '../db'
import { apiPath, authed, errorResponse, invalidBody, readJsonObject } from '../utils'

const isOpen = (e: AnomalyEvent) => isOpenStatus(e.status)

const cameraName = (id: number) => db.cameras.find((c) => c.id === id)?.name ?? `Kamera ${id}`

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString()

/** Tasarımdaki kurallar: sorgu küçük harfe çevrilir, ilk eşleşen kural yanıt verir. */
function respond(query: string, user: User): AssistantResponse {
  const text = query.toLocaleLowerCase('tr')

  if (/kapat/.test(text)) {
    // Tasarımdaki gibi listedeki ilk (en yeni) açık olay.
    const event = db.events
      .filter(isOpen)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    if (!event) return { answer: 'Kapatılacak açık olay yok.', actions: [] }
    setEventStatus(event, 'confirmed', user, 'Sesli asistan ile kapatıldı')
    return {
      answer: `${eventCode(event.id)} kapatıldı (${eventTypeLabel(event.type)}, ${cameraName(event.camera_id)}).`,
      actions: [{ type: 'acknowledge_alarm', event_id: event.id }],
    }
  }

  if (/mevzuat|madde|kkd|kanun/.test(text)) {
    return {
      answer:
        'Baret ve yelek eksikliği 6331 sayılı İSG Kanunu ve KKD Yönetmeliği kapsamındadır. ' +
        'İşveren, gerekli koruyucu donanımın kullanılmasını sağlamakla yükümlüdür.',
      actions: [],
    }
  }

  if (/kamera|çevrimdışı|aktif/.test(text)) {
    const online = db.cameras.filter((c) => c.is_active).length
    const offline = db.cameras.filter((c) => !c.is_active).map((c) => c.name)
    return {
      answer: `${online} kamera çevrimiçi. Çevrimdışı: ${offline.length ? offline.join(', ') : 'yok'}.`,
      actions: [],
    }
  }

  if (/ihlal|olay|kaç|son/.test(text)) {
    const todays = db.events.filter((e) => isToday(e.created_at))
    const open = todays.filter(isOpen)
    const list = open
      .map((e) => `${eventTypeLabel(e.type)} (${cameraName(e.camera_id)})`)
      .join(', ')
    return {
      answer: `Bugün ${todays.length} olay kaydedildi. ${open.length} tanesi açık${list ? `: ${list}` : ''}.`,
      actions: [],
    }
  }

  return {
    answer: 'Bunu anlayamadım. Olaylar, kameralar veya mevzuat hakkında sorabilirsiniz.',
    actions: [],
  }
}

export const assistantHandlers = [
  http.post(
    apiPath('/assistant/query'),
    authed(async ({ request, user }) => {
      const body = await readJsonObject(request)
      if (!body) return invalidBody()
      const query = typeof body.query === 'string' ? body.query.trim() : ''
      if (!query) return errorResponse(422, 'query is required')

      const result = respond(query, user)
      addAgentLog(user, query, result.answer)
      return HttpResponse.json(result)
    }),
  ),
]
