import { HOURS_PER_DAY, twoDigits } from '@/lib/format'
import type { EventStats } from '@/types'
import {
  Bar,
  BarChart,
  LabelList,
  Rectangle,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type TooltipContentProps,
} from 'recharts'

/**
 * Sütunun üst köşeleri yuvarlak (tasarımda 4 px). Recharts SVG'ye sayı ister, CSS token'ı
 * kullanılamaz; değer tek burada.
 */
const COLUMN_RADIUS: [number, number, number, number] = [4, 4, 0, 0]
/** Kart yanındaki dağılım kısa kalsa da grafik en az bu kadar yüksek. */
const MIN_HEIGHT = 200

interface HourDatum {
  hour: number
  /** Eksendeki yazı: "09" */
  label: string
  count: number
  /** Şimdiki saat: sütun turuncu çizilir. */
  current: boolean
}

/** Backend tespit olmayan saati göndermese de 24 sütun çizilir. */
function toHourData(byHour: EventStats['by_hour'], currentHour: number | null): HourDatum[] {
  const counts = new Map(byHour.map((h) => [h.hour, h.count]))
  return Array.from({ length: HOURS_PER_DAY }, (_, hour) => ({
    hour,
    label: twoDigits(hour),
    count: counts.get(hour) ?? 0,
    current: hour === currentHour,
  }))
}

// Renk SVG'ye sınıfla verilir (token'dan); Recharts'ın yazdığı `fill` niteliğini CSS ezer.
function HourBar(props: BarShapeProps) {
  const datum = props.payload as HourDatum
  return (
    <Rectangle {...props} className={datum.current ? 'fill-chart-bar-current' : 'fill-chart-bar'} />
  )
}

function HourTooltip({ active, payload }: TooltipContentProps) {
  const datum = payload?.[0]?.payload as HourDatum | undefined
  if (!active || !datum) return null
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] shadow-popover">
      <div className="font-mono text-zinc-500">
        {twoDigits(datum.hour)}:00–{twoDigits((datum.hour + 1) % HOURS_PER_DAY)}:00
        {datum.current && ' · şu an'}
      </div>
      <div className="font-semibold">{datum.count} tespit</div>
    </div>
  )
}

/** Sütunun üstündeki sayı. 24 sütunda kalabalık olmasın diye 0 yazılmaz. */
const countLabel = (value: unknown) => (value ? String(value) : '')

interface HourlyChartProps {
  byHour: EventStats['by_hour']
  /** Seçili aralık bugünü kapsıyorsa şimdiki saat, yoksa null. */
  currentHour: number | null
}

/** Saatlik tespit sütun grafiği (tesisin yerel saati, 00–23). */
export function HourlyChart({ byHour, currentHour }: HourlyChartProps) {
  const data = toHourData(byHour, currentHour)
  const peak = data.reduce((best, d) => (d.count > best.count ? d : best), data[0]!)
  const summary =
    peak.count === 0
      ? 'Bu aralıkta tespit yok.'
      : `En yoğun saat ${peak.label}:00, ${peak.count} tespit.`

  return (
    <figure className="m-0 flex flex-1 flex-col" style={{ minHeight: MIN_HEIGHT }}>
      <figcaption className="sr-only">Saatlik tespit sayıları. {summary}</figcaption>
      <BarChart
        responsive
        data={data}
        // Kartın kalan yüksekliğini doldurur (yandaki dağılım kartıyla aynı boy).
        style={{ width: '100%', flex: 1 }}
        margin={{ top: 18, right: 0, bottom: 0, left: 0 }}
        barCategoryGap="18%"
      >
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={4}
          tick={{ className: 'fill-zinc-400 font-mono text-[11px]' }}
        />
        <YAxis hide allowDecimals={false} />
        <Tooltip
          content={HourTooltip}
          cursor={{ className: 'fill-zinc-100' }}
          isAnimationActive={false}
        />
        <Bar
          dataKey="count"
          shape={HourBar}
          radius={COLUMN_RADIUS}
          minPointSize={2}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="count"
            position="top"
            formatter={countLabel}
            className="fill-zinc-500 font-mono text-[11px]"
          />
        </Bar>
      </BarChart>
    </figure>
  )
}
