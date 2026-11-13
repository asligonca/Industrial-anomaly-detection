import type { EventType } from '@/types'

/** Türe göre dağılım çubuğunun rengi. Sınıf adları tam yazılı ki Tailwind derlemede bulsun. */
const typeBarColors: Record<EventType, string> = {
  no_helmet: 'bg-chart-no-helmet',
  no_vest: 'bg-chart-no-vest',
  forklift_proximity: 'bg-chart-forklift',
  restricted_zone: 'bg-chart-restricted',
  unregistered_visitor: 'bg-chart-visitor',
  no_face_shield: 'bg-chart-face-shield',
  smoke_detected: 'bg-chart-smoke',
  person_near_equipment: 'bg-chart-equipment',
}

/** Bilinmeyen tür kodunda (backend yeni tür eklediyse) nötr sütun rengi. */
export function typeBarColor(type: EventType): string {
  return (typeBarColors as Partial<Record<string, string>>)[type] ?? 'bg-chart-bar'
}
