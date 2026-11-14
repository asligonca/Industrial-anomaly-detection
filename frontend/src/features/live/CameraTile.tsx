import { cameraFrameUrl } from '@/api/cameras'
import { Badge } from '@/components/ui/Badge'
import { severityTones } from '@/components/ui/badgeTones'
import { cn } from '@/lib/cn'
import { cameraCode, eventTypeLabel, severityLabels } from '@/lib/labels'
import type { Camera } from '@/types'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CameraClock } from './CameraClock'
import type { CameraHighlight } from './cameraHighlights'

/** Görüntü yüklenemezse yeniden deneme aralığı. */
const FRAME_RETRY_MS = 15_000

interface CameraTileProps {
  camera: Camera
  /** Kameradaki en önemli açık olay. Varsa kart vurgulanır ve olaya bağlantı olur. */
  highlight?: CameraHighlight
  /** Geniş ekrandaki büyük kart: kamera adı daha büyük yazılır. Izgara yeri `className` ile. */
  featured?: boolean
  /** Seçili grupta değil: yerinde kalır ama soluk görünür. */
  dimmed?: boolean
  /** Yalnızca ızgara yerleşimi (`lg:col-span-2` gibi). */
  className?: string
}

/** Canlı izleme ızgarasındaki tek kamera: görüntü, durum, saat ve varsa ihlal etiketi. */
export function CameraTile({
  camera,
  highlight,
  featured = false,
  dimmed = false,
  className,
}: CameraTileProps) {
  const [frameFailed, setFrameFailed] = useState(false)
  // Her deneme yeni bir <img> açar (key), tarayıcı adresi yeniden ister.
  const [attempt, setAttempt] = useState(0)

  // Kamera kapatılıp yeniden açılınca eski hata taşınmasın (React'in "prop değişince state
  // sıfırla" kalıbı: render sırasında, efekt olmadan).
  const [wasActive, setWasActive] = useState(camera.is_active)
  if (wasActive !== camera.is_active) {
    setWasActive(camera.is_active)
    setFrameFailed(false)
  }

  // Görüntü gelmediyse bir süre sonra yeniden dene; bağlantı dönünce kart kendiliğinden canlanır.
  useEffect(() => {
    if (!frameFailed || !camera.is_active) return
    const timer = setTimeout(() => {
      setFrameFailed(false)
      setAttempt((n) => n + 1)
    }, FRAME_RETRY_MS)
    return () => clearTimeout(timer)
  }, [frameFailed, camera.is_active])

  // Kamera kapalıysa ya da görüntü gelmiyorsa ikisi de "bağlantı yok" sayılır.
  const offline = !camera.is_active || frameFailed
  const code = cameraCode(camera.id)

  const content = (
    <>
      {camera.is_active && (
        <img
          key={attempt}
          src={cameraFrameUrl(camera.id)}
          alt=""
          onError={() => setFrameFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {/* Üst ve alt yazılar görüntünün üstünde okunsun diye koyu geçiş. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[30%] bg-linear-to-b from-zinc-900/80 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[32%] bg-linear-to-t from-zinc-900/75 to-transparent"
      />

      {offline && (
        <div className="absolute inset-0 grid place-items-center bg-zinc-900/82 text-sm text-zinc-200">
          Bağlantı yok
        </div>
      )}

      <div className="absolute top-3 left-4 max-w-[calc(100%-8rem)]">
        <div className="font-mono text-xs font-medium text-camera-code">{code}</div>
        <div
          className={cn(
            'mt-0.5 truncate text-[15px] font-semibold text-white',
            featured && 'lg:text-xl',
          )}
        >
          {camera.name}
        </div>
      </div>

      <div className="absolute top-3 right-3 flex h-[26px] items-center gap-1.5 rounded-badge bg-zinc-900/85 px-2.5 font-mono text-xs text-white">
        <span
          aria-hidden
          className={cn('size-[7px] rounded-full', offline ? 'bg-zinc-400' : 'bg-danger')}
        />
        {offline ? 'KAPALI' : 'CANLI'}
      </div>

      {!offline && (
        <div className="absolute bottom-3 left-4">
          <CameraClock />
        </div>
      )}

      {/* Kamera kapalı olsa da açık ihlal görünür kalır. */}
      {highlight && (
        <div className="absolute right-3 bottom-2.5">
          <Badge size="lg" tone={severityTones[highlight.event.severity]}>
            {eventTypeLabel(highlight.event.type)}
            {highlight.others > 0 && ` +${highlight.others}`}
          </Badge>
        </div>
      )}
    </>
  )

  const tileClass = cn(
    'relative min-h-0 overflow-hidden rounded-card border-2 bg-zinc-800 transition-opacity',
    highlight ? 'border-warn' : 'border-transparent',
    dimmed && 'opacity-30',
    className,
  )
  // Soluk kart görsel olarak geri planda; ekran okuyucu da bunu duysun.
  const filterNote = dimmed ? ' (filtre dışında)' : ''

  if (!highlight) {
    return (
      <div className={tileClass} aria-label={`${code} ${camera.name}${filterNote}`} role="group">
        {content}
      </div>
    )
  }

  const { event, others } = highlight
  const label =
    `${code} ${camera.name}${filterNote}: ` +
    `${eventTypeLabel(event.type)}, ${severityLabels[event.severity]}` +
    (others > 0 ? `, ${others} açık olay daha` : '') +
    '. Olayı aç.'

  return (
    <Link to={`/events/${event.id}`} aria-label={label} className={tileClass}>
      {content}
    </Link>
  )
}
