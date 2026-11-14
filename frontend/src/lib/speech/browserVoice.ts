/** Yedek ses: tarayıcının yerleşik sesi (Web Speech API, `speechSynthesis`). */
export const browserVoiceSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

/** Türkçe ses varsa onu seçer; yoksa tarayıcı `lang`'e göre en yakın sesi kullanır. */
function turkishVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('tr'))
}

interface BrowserSpeechHandlers {
  /** Okunan kısmın oranı (0–1). Bazı sesler kelime sınırı olayı göndermez; o zaman gelmez. */
  onProgress: (fraction: number) => void
  onEnd: () => void
}

let current: SpeechSynthesisUtterance | null = null

export function cancelBrowserVoice() {
  if (!browserVoiceSupported) return
  current = null
  window.speechSynthesis.cancel()
}

export function speakWithBrowserVoice(text: string, { onProgress, onEnd }: BrowserSpeechHandlers) {
  if (!browserVoiceSupported) {
    onEnd()
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'tr-TR'
  const voice = turkishVoice()
  if (voice) utterance.voice = voice

  // İptal edilen eski konuşmanın geç gelen olayı yenisini etkilemesin.
  const isCurrent = () => current === utterance
  utterance.onboundary = (e) => {
    if (isCurrent()) onProgress(Math.min(1, (e.charIndex + (e.charLength ?? 0)) / text.length))
  }
  const finish = () => {
    if (!isCurrent()) return
    current = null
    onEnd()
  }
  utterance.onend = finish
  utterance.onerror = finish

  current = utterance
  window.speechSynthesis.speak(utterance)
}
