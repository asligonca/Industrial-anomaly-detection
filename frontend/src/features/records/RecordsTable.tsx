import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import type { AnomalyEvent } from '@/types'
import { RecordRow } from './RecordRow'

const SKELETON_ROWS = 6

/** Sütun başlığı ve genişliği (tasarımdaki ızgara). Genişliği olmayan sütunlar kalanı paylaşır. */
const columns: { label: string; width?: string }[] = [
  { label: 'Görüntü', width: 'w-[108px]' },
  { label: 'Olay no', width: 'w-[106px]' },
  { label: 'Saat', width: 'w-[106px]' },
  { label: 'Kamera' },
  { label: 'Tür' },
  { label: 'Güven', width: 'w-[116px]' },
  { label: 'Önem', width: 'w-[106px]' },
  { label: 'Durum', width: 'w-[150px]' },
  { label: 'İşlem', width: 'w-[80px]' },
]

interface RecordsTableProps {
  /** Yükleniyorsa undefined. */
  events: AnomalyEvent[] | undefined
  cameraNames: Map<number, string>
  /** Şimdiki zaman (bugünkü kayıtta yalnızca saat yazar). */
  now: Date
  /** Filtre değişti, yeni sonuç bekleniyor: eski satırlar soluk kalır. */
  stale: boolean
}

/** Kayıtlar tablosu. Dar ekranda kendi içinde yatay kayar, sayfa kaymaz. */
export function RecordsTable({ events, cameraNames, now, stale }: RecordsTableProps) {
  return (
    // `relative`: başlıktaki sr-only (absolute) yazı kaydırma kutusundan kaçıp sayfayı genişletmesin.
    <div className="relative overflow-x-auto rounded-card border border-zinc-200 bg-white">
      <table
        aria-busy={events === undefined || stale}
        className={cn(
          'w-full min-w-[960px] table-fixed border-collapse text-left text-sm transition-opacity',
          stale && 'opacity-60',
        )}
      >
        <colgroup>
          {columns.map((col) => (
            <col key={col.label} className={col.width} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-zinc-200 text-[12px] tracking-[0.04em] text-zinc-500 uppercase">
            {columns.map((col, i) => (
              <th
                key={col.label}
                scope="col"
                className={cn(
                  'py-3.5 pr-4 font-normal',
                  i === 0 && 'pl-5',
                  i === columns.length - 1 && 'pr-5',
                )}
              >
                {/* İşlem sütununun başlığı ekranda boş (tasarımdaki gibi), ekran okuyucu okur. */}
                {i === columns.length - 1 ? (
                  <span className="sr-only">{col.label}</span>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events === undefined ? (
            Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <tr key={i} className="border-b border-zinc-100 last:border-b-0">
                <td colSpan={columns.length} className="px-5 py-2.5">
                  <Skeleton className="h-11" />
                </td>
              </tr>
            ))
          ) : events.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-zinc-500">
                Sonuç yok
              </td>
            </tr>
          ) : (
            events.map((event) => (
              <RecordRow
                key={event.id}
                event={event}
                cameraName={cameraNames.get(event.camera_id)}
                now={now}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
