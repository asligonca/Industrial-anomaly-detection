import type {
  AnomalyEvent,
  EventFilters,
  EventStats,
  EventStatsRange,
  EventStatusUpdate,
  Paginated,
} from '@/types'
import { apiRequest } from './client'

export function getEvents(filters: EventFilters = {}, signal?: AbortSignal) {
  return apiRequest<Paginated<AnomalyEvent>>('/events', { query: filters, signal })
}

export function getEventStats(range: EventStatsRange = {}, signal?: AbortSignal) {
  return apiRequest<EventStats>('/events/stats', { query: range, signal })
}

export function updateEventStatus(id: number, update: EventStatusUpdate) {
  return apiRequest<AnomalyEvent>(`/events/${id}/status`, { method: 'PATCH', json: update })
}
