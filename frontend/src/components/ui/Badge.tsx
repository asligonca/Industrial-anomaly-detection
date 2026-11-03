import { cn } from '@/lib/cn'
import { eventStatusLabels, severityLabels } from '@/lib/labels'
import type { EventStatus, Severity } from '@/types'
import type { ReactNode } from 'react'

type BadgeSize = 'sm' | 'md' | 'lg'

const badgeSizes: Record<BadgeSize, string> = {
  sm: 'px-2 py-[3px] text-[11px]',
  md: 'px-[9px] py-[3px] text-xs',
  lg: 'px-[11px] py-[5px] text-[13px]',
}

interface BadgeProps {
  size?: BadgeSize
  /** Renk sınıfları (zemin + yazı). Önem/durum için `SeverityBadge` ve `StatusBadge` kullan. */
  tone: string
  children: ReactNode
}

/** Küçük, kalın yazılı etiket. Renkler dışarıdan gelir. */
export function Badge({ size = 'md', tone, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-badge font-bold whitespace-nowrap',
        badgeSizes[size],
        tone,
      )}
    >
      {children}
    </span>
  )
}

const severityTones: Record<Severity, string> = {
  critical: 'bg-severity-critical text-severity-critical-ink',
  high: 'bg-severity-high text-severity-high-ink',
  medium: 'bg-severity-medium text-severity-medium-ink',
  info: 'bg-severity-info text-severity-info-ink',
}

/** Önem düzeyi rozeti (KRİTİK / YÜKSEK / ORTA / BİLGİ). */
export function SeverityBadge({ severity, size }: { severity: Severity; size?: BadgeSize }) {
  return (
    <Badge size={size} tone={severityTones[severity]}>
      {severityLabels[severity]}
    </Badge>
  )
}

interface StatusStyle {
  pill: string
  text: string
  dot: string
}

const closed: StatusStyle = {
  pill: 'bg-status-closed text-status-closed-ink',
  text: 'text-status-closed-ink',
  dot: 'bg-status-closed-dot',
}

const statusStyles: Record<EventStatus, StatusStyle> = {
  new: {
    pill: 'bg-status-open text-status-open-ink',
    text: 'text-status-open-ink',
    dot: 'bg-status-open-dot',
  },
  reviewing: {
    pill: 'bg-status-reviewing text-status-reviewing-ink',
    text: 'text-status-reviewing-ink',
    dot: 'bg-status-reviewing-dot',
  },
  confirmed: closed,
  false_alarm: closed,
}

interface StatusBadgeProps {
  status: EventStatus
  /** `pill`: renkli hap (detay başlığı). `dot`: nokta + yazı (liste satırı). */
  variant?: 'pill' | 'dot'
}

/** Olay durumu rozeti (Açık / İnceleniyor / Kapandı / Yanlış alarm). */
export function StatusBadge({ status, variant = 'pill' }: StatusBadgeProps) {
  const style = statusStyles[status]
  const label = eventStatusLabels[status]

  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-[13px]', style.text)}>
        <span aria-hidden className={cn('size-1.5 rounded-full', style.dot)} />
        {label}
      </span>
    )
  }
  return (
    <span className={cn('inline-block rounded-full px-3 py-[5px] text-[13px]', style.pill)}>
      {label}
    </span>
  )
}
