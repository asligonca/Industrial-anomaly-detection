import { useCallback, useEffect, useRef, useState } from 'react'

/** TypeScript'in DOM tiplerinde `SpeechRecognition` yok; kullandığımız kadarı. */
interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type RecognitionConstructor = new () => Recognition

const RecognitionImpl: RecognitionConstructor | undefined =
  typeof window === 'undefined'
    ? undefined
    : ((window as unknown as Record<string, RecognitionConstructor | undefined>)
        .SpeechRecognition ??
      (window as unknown as Record<string, RecognitionConstructor | undefined>)
        .webkitSpeechRecognition)

const errorMessages: Partial<Record<SpeechRecognitionErrorCode, string>> = {
  'no-speech': 'Ses algılanmadı. Tekrar deneyin.',
  'audio-capture': 'Mikrofon bulunamadı.',
  'not-allowed': 'Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verin ya da yazarak sorun.',
  'service-not-allowed': 'Ses tanıma bu tarayıcıda kapalı. Yazarak sorabilirsiniz.',
  network: 'Ses tanıma için internet bağlantısı gerekiyor. Yazarak sorabilirsiniz.',
}

/**
 * Konuşmayı metne çevirir (Web Speech API, tr-TR). Tek cümle dinler, bitince `onResult`'u
 * çağırır. Desteklenmeyen tarayıcıda `supported: false` (mikrofon düğmesi gizlenir).
 * Not: Chrome sesi tanıma için Google sunucularına gönderir.
 */
export function useSpeechRecognition(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognition = useRef<Recognition | null>(null)
  const onResultRef = useRef(onResult)

  useEffect(() => {
    onResultRef.current = onResult
  })

  const start = useCallback(() => {
    if (!RecognitionImpl || recognition.current) return
    const r = new RecognitionImpl()
    r.lang = 'tr-TR'
    r.continuous = false
    r.interimResults = false
    r.maxAlternatives = 1
    r.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript.trim()
      if (text) onResultRef.current(text)
    }
    r.onerror = (event) => {
      if (event.error !== 'aborted') {
        setError(errorMessages[event.error] ?? 'Ses tanınamadı. Tekrar deneyin.')
      }
    }
    r.onend = () => {
      if (recognition.current === r) recognition.current = null
      setListening(false)
    }
    recognition.current = r
    setError(null)
    setListening(true)
    try {
      r.start()
    } catch {
      recognition.current = null
      setListening(false)
      setError('Ses tanıma başlatılamadı.')
    }
  }, [])

  const stop = useCallback(() => recognition.current?.stop(), [])

  // Bileşen kalkınca dinleme sürmesin.
  useEffect(
    () => () => {
      const r = recognition.current
      recognition.current = null
      r?.abort()
    },
    [],
  )

  return { supported: Boolean(RecognitionImpl), listening, error, start, stop }
}
