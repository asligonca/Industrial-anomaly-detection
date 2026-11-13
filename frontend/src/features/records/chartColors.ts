import type { EventType } from '@/types'

/** Türe göre dağılım çubuğunun rengi. Sınıf adları tam yazılı ki Tailwind derlemede bulsun. */
export const typeBarColors: Record<EventType, string> = {
  no_helmet: 'bg-chart-no-helmet',
  no_vest: 'bg-chart-no-vest',
  forklift_proximity: 'bg-chart-forklift',
  restricted_zone: 'bg-chart-restricted',
  unregistered_visitor: 'bg-chart-visitor',
  no_face_shield: 'bg-chart-face-shield',
  smoke_detected: 'bg-chart-smoke',
  person_near_equipment: 'bg-chart-equipment',
}
