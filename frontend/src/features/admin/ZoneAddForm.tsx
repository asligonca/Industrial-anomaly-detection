import { useCreateZone } from '@/api/hooks/useCreateZone'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/inputStyles'
import { ruleTypeLabels, ruleTypes } from '@/lib/labels'
import type { Camera, Point, RuleType } from '@/types'
import { useId, useRef, useState } from 'react'
import { inlineErrorClass } from './adminStyles'

/**
 * Bölge çizim aracı henüz yok: yeni bölge tüm kareyi kaplar (görüntüye göre 0–1 köşeler).
 * Backend `polygon`'u zorunlu tutarsa bu gönderilir (backend-notlari madde 14–15).
 */
const FULL_FRAME_POLYGON: Point[] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
]

const DEFAULT_RULE: RuleType = 'restricted'

/** Bölgeler listesinin altındaki ekleme satırı: ad, kamera, kural tipi, "Ekle". */
export function ZoneAddForm({ cameras }: { cameras: Camera[] | undefined }) {
  const create = useCreateZone()
  const [name, setName] = useState('')
  const [pickedCamera, setPickedCamera] = useState<number | null>(null)
  const [rule, setRule] = useState<RuleType>(DEFAULT_RULE)
  const [nameError, setNameError] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const errorId = useId()

  // Seçilmemişse (ya da seçilen kamera artık yoksa) ilk kamera.
  const cameraId =
    cameras?.find((camera) => camera.id === pickedCamera)?.id ?? cameras?.[0]?.id ?? null
  const noCameras = cameras !== undefined && cameras.length === 0

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError(true)
      nameRef.current?.focus()
      return
    }
    if (cameraId === null || create.isPending) return
    create.mutate(
      { name: trimmed, camera_id: cameraId, rule_type: rule, polygon: FULL_FRAME_POLYGON },
      {
        onSuccess: () => {
          setName('')
          nameRef.current?.focus()
        },
      },
    )
  }

  const message = nameError
    ? 'Bölge adını girin.'
    : noCameras
      ? 'Bölge eklemek için önce kamera ekleyin.'
      : create.isError
        ? `Bölge eklenemedi: ${create.error.message}`
        : null

  return (
    <form
      aria-label="Bölge ekle"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="grid gap-3 rounded-b-card border-t border-zinc-100 bg-zinc-50 px-5 py-3.5 sm:grid-cols-[1fr_1fr_1.2fr_150px] sm:items-center"
    >
      <input
        ref={nameRef}
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setNameError(false)
        }}
        placeholder="Bölge adı"
        aria-label="Bölge adı"
        aria-invalid={nameError || undefined}
        aria-describedby={message ? errorId : undefined}
        autoComplete="off"
        className={inputClass('md', 'min-w-0')}
      />
      <select
        value={cameraId ?? ''}
        onChange={(e) => setPickedCamera(Number(e.target.value))}
        aria-label="Kamera"
        disabled={!cameras || noCameras}
        className={inputClass('md', 'min-w-0')}
      >
        {cameras?.map((camera) => (
          <option key={camera.id} value={camera.id}>
            {camera.code} · {camera.name}
          </option>
        ))}
      </select>
      <select
        value={rule}
        onChange={(e) => setRule(e.target.value as RuleType)}
        aria-label="Kural tipi"
        className={inputClass('md', 'min-w-0')}
      >
        {ruleTypes.map((type) => (
          <option key={type} value={type}>
            {ruleTypeLabels[type]}
          </option>
        ))}
      </select>
      <Button
        type="submit"
        size="md"
        aria-disabled={create.isPending || cameraId === null}
        className="sm:w-[80px] sm:justify-self-end"
      >
        {create.isPending ? 'Ekleniyor…' : 'Ekle'}
      </Button>
      {message && (
        <p id={errorId} role="alert" className={`${inlineErrorClass} sm:col-span-4`}>
          {message}
        </p>
      )}
    </form>
  )
}
