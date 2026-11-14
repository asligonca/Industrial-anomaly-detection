import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/inputStyles'
import type { DayRange } from './recordsFilters'

interface DateRangeFilterProps extends DayRange {
  /** Seçilebilecek son gün (bugün), YYYY-MM-DD. */
  max: string
  onChange: (range: DayRange) => void
}

const dateInputClass = inputClass('sm', 'font-mono')

/**
 * Başlangıç ve bitiş günü. Başlangıç bitişten sonraya alınırsa bitiş de onunla birlikte kayar
 * (ve tersi), böylece aralık hiçbir zaman ters olmaz; hata mesajına gerek kalmaz.
 */
export function DateRangeFilter({ from, to, max, onChange }: DateRangeFilterProps) {
  return (
    <fieldset className="flex flex-wrap items-end gap-2">
      <legend className="sr-only">Tarih aralığı</legend>
      <label className="flex flex-col gap-1 text-[12px] text-zinc-500">
        Başlangıç
        <input
          type="date"
          value={from}
          max={to || max}
          onChange={(e) => {
            const next = e.target.value
            onChange({ from: next, to: next && to && next > to ? next : to })
          }}
          className={dateInputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-[12px] text-zinc-500">
        Bitiş
        <input
          type="date"
          value={to}
          min={from || undefined}
          max={max}
          onChange={(e) => {
            const next = e.target.value
            onChange({ from: next && from && next < from ? next : from, to: next })
          }}
          className={dateInputClass}
        />
      </label>
      {(from || to) && (
        <Button variant="secondary" size="sm" onClick={() => onChange({ from: '', to: '' })}>
          Tüm zamanlar
        </Button>
      )}
    </fieldset>
  )
}
