import { eventTypeLabel, isOpenStatus } from '@/lib/labels'
import type { AnomalyEvent, AssistantResponse } from '@/types'
import { http, HttpResponse } from 'msw'
import { addAgentLog, db } from '../db'
import { apiPath, authed, errorResponse, invalidBody, readJsonObject } from '../utils'

const isOpen = (e: AnomalyEvent) => isOpenStatus(e.status)

const cameraName = (id: number) => db.cameras.find((c) => c.id === id)?.name ?? `Kamera ${id}`

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString()

/** Tasarımdaki kurallar: sorgu küçük harfe çevrilir, ilk eşleşen kural yanıt verir. */
function respond(query: string): AssistantResponse {
  const text = query.toLocaleLowerCase('tr')

  if (/kapat|incele|üstlen/.test(text)) {
    // Sözleşme: asistan yalnızca önerir, olayı değiştirmez. Onaylanınca ön yüz
    // PATCH /events/{id}/status ile `reviewing` yapar (acknowledge_alarm). En yeni yeni olay.
    const event = db.events
      .filter((e) => e.status === 'new')
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    if (!event) return { answer: 'İncelemeye alınacak yeni olay yok.', actions: [] }
    return {
      answer: `${event.code}: ${eventTypeLabel(event.type)}, ${cameraName(event.camera_id)}. İncelemeye alınsın mı?`,
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
    const summary = `Bugün ${todays.length} olay kaydedildi, ${open.length} tanesi açık`
    if (/saat/.test(text)) {
      const hourAgo = Date.now() - 60 * 60 * 1000
      const lastHour = db.events.filter((e) => new Date(e.created_at).getTime() >= hourAgo)
      const head = lastHour.length
        ? `Son bir saatte ${lastHour.length} ihlal kaydedildi.`
        : 'Son bir saatte ihlal kaydedilmedi.'
      return { answer: `${head} ${summary}.`, actions: [] }
    }
    const list = open
      .map((e) => `${eventTypeLabel(e.type)} (${cameraName(e.camera_id)})`)
      .join(', ')
    return { answer: `${summary}${list ? `: ${list}` : ''}.`, actions: [] }
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

      const result = respond(query)
      addAgentLog(user, query, result.answer)
      return HttpResponse.json(result)
    }),
  ),
]
