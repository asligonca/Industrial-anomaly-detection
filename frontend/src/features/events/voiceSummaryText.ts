import { eventTypeLabel } from '@/lib/labels'
import type { AnomalyEvent, Severity } from '@/types'

const openers: Record<Exclude<Severity, 'critical'>, string> = {
  high: 'Yüksek önemde uyarı.',
  medium: 'Orta önemde uyarı.',
  info: 'Bilgilendirme.',
}

/** Sesli özette okunacak metin. Tasarımdaki gibi önem düzeyine göre kurulur. */
export function voiceSummaryText(
  event: Pick<AnomalyEvent, 'type' | 'severity'>,
  cameraName: string,
): string {
  const type = eventTypeLabel(event.type).toLocaleLowerCase('tr')
  if (event.severity === 'critical') {
    return `Kritik uyarı. ${cameraName} bölgesinde ${type} tespit edildi. Bölge sorumlusu bilgilendirilmeli.`
  }
  return `${openers[event.severity]} ${cameraName}: ${type}. İnceleme önerilir.`
}
