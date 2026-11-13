import type { EventFilters, EventStatsRange } from '@/types'

/**
 * Sorgu anahtarları tek yerde. Hiyerarşik: ['events'] geçersiz kılınınca
 * ['events', 'list', ...] ['events', 'stats', ...], ['events', 'detail', id] ve
 * ['events', 'analysis', id] da yenilenir.
 */
export const queryKeys = {
  cameras: {
    all: ['cameras'] as const,
  },
  zones: {
    all: ['zones'] as const,
  },
  events: {
    all: ['events'] as const,
    list: (filters: EventFilters) => ['events', 'list', filters] as const,
    detail: (id: number) => ['events', 'detail', id] as const,
    analysis: (id: number) => ['events', 'analysis', id] as const,
    stats: (range: EventStatsRange) => ['events', 'stats', range] as const,
  },
}
