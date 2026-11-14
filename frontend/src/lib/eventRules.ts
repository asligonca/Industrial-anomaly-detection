/**
 * Olayla ilgili iş kuralları (etiket değil): hangi durum açık sayılır, hangi geçişe izin var,
 * önem sırası, asistan önerisinin hangi duruma götürdüğü. Etiketler `labels.ts`'te.
 */
import type { AssistantAction, EventStatus, Severity } from '@/types'

/** Operatörün ilgilenmesi gereken durumlar (Olaylar listesi, menü rozeti, kamera vurgusu). */
export const OPEN_STATUSES: EventStatus[] = ['new', 'reviewing']

export const isOpenStatus = (status: EventStatus) => OPEN_STATUSES.includes(status)

/** Önem sırası: büyük olan daha önemli (critical > high > medium > info). Backend `sort=severity` de böyle. */
export const severityRank: Record<Severity, number> = { info: 0, medium: 1, high: 2, critical: 3 }

/**
 * Backend'in izin verdiği durum geçişleri; diğerleri `409 Conflict`. Kapanmış olay yeniden
 * açılabilir (-> İnceleniyor), incelenen olay bırakılabilir (-> Açık). Sıra, düğmelerin ekrandaki
 * sırasıdır (`statusActionsFor` buradan üretir).
 */
export const statusTransitions: Record<EventStatus, readonly EventStatus[]> = {
  new: ['reviewing', 'false_alarm', 'confirmed'],
  reviewing: ['new', 'false_alarm', 'confirmed'],
  confirmed: ['reviewing'],
  false_alarm: ['reviewing'],
}

export const canChangeStatus = (from: EventStatus, to: EventStatus) =>
  statusTransitions[from].includes(to)

/** Durum değiştirme düğmesi: hedef durum ve düğme yazısı. */
export interface StatusAction {
  status: EventStatus
  label: string
}

/** Hedef duruma göre düğme yazısı. İncelemeye alma, açık olayda "Üstlen", kapanmışta "Yeniden aç". */
function statusActionLabel(from: EventStatus, to: EventStatus): string {
  if (to === 'reviewing') return isOpenStatus(from) ? 'Üstlen' : 'Yeniden aç'
  if (to === 'new') return 'İncelemeyi bırak'
  return to === 'confirmed' ? 'Olayı kapat' : 'Yanlış alarm'
}

/**
 * Olayda yapılabilecek durum değişiklikleri (`statusTransitions`'tan), sırası ekrandaki gibi.
 * Olay detayı ve Kayıtlar tablosu aynı listeyi kullanır.
 */
export function statusActionsFor(status: EventStatus): StatusAction[] {
  return statusTransitions[status].map((to) => ({
    status: to,
    label: statusActionLabel(status, to),
  }))
}

/**
 * Asistan önerisinin onay düğmesi ve onaylanınca olayın geçeceği durum. SPRINT_PLAN:
 * `acknowledge_alarm` onaylanınca -> `reviewing`. Tasarımdaki "Açık olayı kapat" çipiyle çelişkisi
 * backend'e soruldu (backend-notlari madde 39, cevap bekliyor).
 */
export const assistantActions: Record<
  AssistantAction['type'],
  { label: string; status: EventStatus; done: string }
> = {
  acknowledge_alarm: { label: 'İncelemeye al', status: 'reviewing', done: 'incelemeye alındı' },
}
