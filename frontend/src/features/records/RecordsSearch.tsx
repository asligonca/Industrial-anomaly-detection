import { inputClass } from '@/components/ui/inputStyles'
import { useEffect, useEffectEvent, useState } from 'react'

const DEBOUNCE_MS = 300

interface RecordsSearchProps {
  value: string
  onChange: (value: string) => void
}

/**
 * Olay no / kamera / tür araması. Her harfte istek atılmaz: yazma 300 ms durunca uygulanır,
 * Enter beklemeden hemen uygular. Baştaki/sondaki boşluk gönderilmez ("baret " = "baret").
 */
export function RecordsSearch({ value, onChange }: RecordsSearchProps) {
  const [draft, setDraft] = useState(value)
  // Adres dışarıdan değişirse (menüden "Kayıtlar"a tıklamak aramayı siler) kutu da ona uyar; yoksa
  // eski yazı 300 ms sonra adrese geri yazılırdı. Değişikliği kutu kendisi gönderdiyse (adres =
  // kırpılmış yazı) kullanıcının yazdığına dokunulmaz.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    if (value !== draft.trim()) setDraft(value)
  }

  function apply(text: string) {
    const next = text.trim()
    if (next !== value) onChange(next)
  }

  // Effect yalnızca yazı ya da adres değişince yeniden kurulur; `apply` hep güncel değerleri görür.
  const applyLater = useEffectEvent((text: string) => apply(text))
  useEffect(() => {
    if (draft.trim() === value) return
    const timer = setTimeout(() => applyLater(draft), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, value])

  return (
    <form
      role="search"
      className="flex min-w-0 flex-[1_1_260px]"
      onSubmit={(e) => {
        e.preventDefault()
        apply(draft)
      }}
    >
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Olay no, kamera veya tür ara"
        aria-label="Kayıtlarda ara (olay no, kamera veya tür)"
        className={inputClass('md', 'w-full min-w-0')}
      />
    </form>
  )
}
