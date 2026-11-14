import type { Severity } from '@/types'

/**
 * Önem düzeyi renkleri (zemin + yazı). `SeverityBadge` ve önem rengini taşıyan başka etiketler
 * (kamera kartındaki ihlal etiketi gibi) aynı sınıfları buradan alır.
 */
export const severityTones: Record<Severity, string> = {
  critical: 'bg-severity-critical text-severity-critical-ink',
  high: 'bg-severity-high text-severity-high-ink',
  medium: 'bg-severity-medium text-severity-medium-ink',
  info: 'bg-severity-info text-severity-info-ink',
}
