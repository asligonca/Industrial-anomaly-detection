import type { EventFilters, EventStatsRange } from '@/types'

/**
 * Sorgu anahtarları tek yerde. Hiyerarşik: ['events'] geçersiz kılınınca
 * ['events', 'list', ...] ve ['events', 'stats', ...] da yenilenir.
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
    stats: (range: EventStatsRange) => ['events', 'stats', range] as const,
  },
}
