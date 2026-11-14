import type {
  AnomalyEvent,
  EventAnalysis,
  EventDetail,
  EventFilters,
  EventStats,
  EventStatsRange,
  EventStatusUpdate,
  Paginated,
} from '@/types'
import { apiRequest, withToken } from './client'

export function getEvents(filters: EventFilters = {}, signal?: AbortSignal) {
  return apiRequest<Paginated<AnomalyEvent>>('/events', { query: filters, signal })
}

export function getEvent(id: number, signal?: AbortSignal) {
  return apiRequest<EventDetail>(`/events/${id}`, { signal })
}

export function getEventAnalysis(id: number, signal?: AbortSignal) {
  return apiRequest<EventAnalysis>(`/events/${id}/analysis`, { signal })
}

export function getEventStats(range: EventStatsRange = {}, signal?: AbortSignal) {
  return apiRequest<EventStats>('/events/stats', { query: range, signal })
}

export function updateEventStatus(id: number, update: EventStatusUpdate) {
  return apiRequest<AnomalyEvent>(`/events/${id}/status`, { method: 'PATCH', json: update })
}

/** Olay görüntüsünün `<img src>` adresi: backend'in `snapshot_url`'i + token. */
export function eventSnapshotUrl(event: Pick<AnomalyEvent, 'snapshot_url'>): string {
  return withToken(event.snapshot_url)
}
