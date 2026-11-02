import type { Zone } from '@/types'

export const zones: Zone[] = [
  {
    id: 1,
    camera_id: 3,
    name: 'Kırmızı alan',
    polygon: [
      [0.55, 0.3],
      [0.9, 0.3],
      [0.9, 0.85],
      [0.55, 0.85],
    ],
    rule_type: 'restricted',
  },
  {
    id: 2,
    camera_id: 1,
    name: 'KKD zorunlu alan',
    polygon: [
      [0.1, 0.2],
      [0.7, 0.2],
      [0.7, 0.95],
      [0.1, 0.95],
    ],
    rule_type: 'ppe_helmet_vest',
  },
  {
    id: 3,
    camera_id: 2,
    name: 'Forklift yolu',
    polygon: [
      [0.3, 0.5],
      [0.8, 0.5],
      [0.8, 1],
      [0.3, 1],
    ],
    rule_type: 'forklift_proximity',
  },
  {
    id: 4,
    camera_id: 4,
    name: 'Yükleme alanı',
    polygon: [
      [0.05, 0.4],
      [0.6, 0.4],
      [0.6, 0.95],
      [0.05, 0.95],
    ],
    rule_type: 'ppe_vest',
  },
]
