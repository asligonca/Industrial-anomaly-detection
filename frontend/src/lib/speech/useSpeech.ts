import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import {
  getSpeechState,
  prepareVoice,
  speak as speakText,
  speechSupported,
  stopSpeech,
  subscribeSpeech,
  type SpeechStatus,
} from './player'

/**
 * Metin okuma (Piper, yedek: tarayıcı sesi). Uygulamada aynı anda tek okuma olur; başka bir
 * bileşen okumaya başlarsa bu bileşen `idle` görür. Bileşen kalkınca kendi okuması durur.
 */
export function useSpeech() {
  const [owner] = useState(() => Symbol('speech'))
  const state = useSyncExternalStore(subscribeSpeech, getSpeechState)
  const mine = state.owner === owner
  const status: SpeechStatus = mine ? state.status : 'idle'

  const speak = useCallback((text: string) => speakText(owner, text), [owner])
  const stop = useCallback(() => stopSpeech(owner), [owner])

  useEffect(() => () => stopSpeech(owner), [owner])

  return {
    supported: speechSupported,
    status,
    /** Okuyor ya da okumaya hazırlanıyor. */
    active: status !== 'idle',
    progress: mine ? state.progress : 0,
    /** Piper modeli inerken inen kısım (0–1), yoksa `null`. Bütün bileşenler görür. */
    download: state.voice === 'loading' ? state.download : null,
    speak,
    stop,
    prepare: prepareVoice,
  }
}
