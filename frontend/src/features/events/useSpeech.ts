import { useCallback, useEffect, useRef, useState } from 'react'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

/** Türkçe ses varsa onu seçer; yoksa tarayıcı `lang`'e göre en yakın sesi kullanır. */
function turkishVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('tr'))
}

/**
 * Tarayıcının yerleşik sesiyle metin okuma (Web Speech API, `speechSynthesis`).
 * `progress`: okunan kısmın oranı (0–1). Bazı sesler kelime sınırı olayı göndermez; o zaman
 * okuma bitene kadar 0 kalır.
 */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [progress, setProgress] = useState(0)
  // Yalnızca güncel konuşmanın olayları state'i değiştirir; iptal edilen eskisinin geç gelen
  // `end`/`error` olayı yeni konuşmayı durdurmasın.
  const current = useRef<SpeechSynthesisUtterance | null>(null)

  const stop = useCallback(() => {
    if (!supported) return
    current.current = null
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setProgress(0)
  }, [])

  const speak = useCallback((text: string) => {
    if (!supported) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    const voice = turkishVoice()
    if (voice) utterance.voice = voice

    const isCurrent = () => current.current === utterance
    utterance.onboundary = (e) => {
      if (isCurrent()) setProgress(Math.min(1, (e.charIndex + (e.charLength ?? 0)) / text.length))
    }
    const finish = () => {
      if (!isCurrent()) return
      current.current = null
      setSpeaking(false)
      setProgress(0)
    }
    utterance.onend = finish
    utterance.onerror = finish

    current.current = utterance
    setSpeaking(true)
    setProgress(0)
    window.speechSynthesis.speak(utterance)
  }, [])

  // Sayfadan çıkınca okuma sürmesin.
  useEffect(() => {
    const ref = current
    return () => {
      if (supported && ref.current) {
        ref.current = null
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return { supported, speaking, progress, speak, stop }
}
