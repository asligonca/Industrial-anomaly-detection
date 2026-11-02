/** `zones.rule_type`. Liste FE-12 (#25) önerisi. */
export type RuleType =
  | 'restricted'
  | 'ppe_helmet_vest'
  | 'ppe_helmet'
  | 'ppe_vest'
  | 'forklift_proximity'
  | 'smoke_fire'
  | 'person_near_equipment'

/** Görüntüye göre normalize nokta: [x, y], ikisi de 0–1 arası. */
export type Point = [number, number]

/** `zones` tablosunun Read şeması. */
export interface Zone {
  id: number
  camera_id: number
  name: string
  polygon: Point[]
  rule_type: RuleType
}

export type ZoneCreate = Omit<Zone, 'id'>

export type ZoneUpdate = Partial<ZoneCreate>
