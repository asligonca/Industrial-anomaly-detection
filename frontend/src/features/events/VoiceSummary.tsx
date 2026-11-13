import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { useSpeech } from './useSpeech'

const BAR_COUNT = 40
/** Tasarımdaki dalga: sabit, rastgele görünen yükseklikler (%). */
const bars = Array.from(
  { length: BAR_COUNT },
  (_, i) => 22 + Math.round(Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 78),
)

/** Olayın sesli özeti: tarayıcının Türkçe sesiyle oynat / durdur. */
export function VoiceSummary({ text }: { text: string }) {
  const { supported, speaking, progress, speak, stop } = useSpeech()
  const played = speaking ? Math.round(progress * BAR_COUNT) : 0

  return (
    <Card className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold">Sesli özet</h2>
        <span className="font-mono text-xs text-zinc-500">TTS</span>
      </div>

      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => (speaking ? stop() : speak(text))}
          disabled={!supported}
          aria-label={speaking ? 'Durdur' : 'Oynat'}
          className="grid size-11 flex-none place-items-center rounded-full bg-zinc-900 text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            {speaking ? (
              <>
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </>
            ) : (
              <path d="M7 4l13 8-13 8z" />
            )}
          </svg>
        </button>
        <div aria-hidden className="flex h-10 flex-1 items-center gap-[3px]">
          {bars.map((height, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-xs',
                i < played ? 'bg-zinc-900' : 'bg-zinc-300',
                speaking && played === 0 && 'motion-safe:animate-pulse',
              )}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-zinc-600">{text}</p>
      {!supported && (
        <p className="text-[13px] text-zinc-500">Bu tarayıcı sesli okumayı desteklemiyor.</p>
      )}
    </Card>
  )
}
