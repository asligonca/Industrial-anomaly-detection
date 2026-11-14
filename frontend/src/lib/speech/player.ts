import { browserVoiceSupported, cancelBrowserVoice, speakWithBrowserVoice } from './browserVoice'
import { onPiperDownload, piperSupported, preparePiper, synthesizePiper } from './piper'
import { speechText } from './speechText'

/**
 * Uygulamanın tek ses çıkışı: aynı anda tek metin okunur (asistan yanıtı başlarsa sesli özet
 * susar). Önce Piper; Piper açılamazsa (internet yok, tarayıcı desteklemiyor) tarayıcının sesi.
 * Ses motoru yalnızca burada; backend `POST /api/tts` gelince (madde 38) değişen dosya burası.
 */

export type SpeechStatus = 'idle' | 'preparing' | 'speaking'
/** Piper modelinin durumu. `fallback`: Piper kullanılamıyor, tarayıcı sesi. */
export type VoiceStatus = 'idle' | 'loading' | 'ready' | 'fallback'

export interface SpeechState {
  /** Okumayı başlatan bileşen. Diğerleri kendilerini boşta görür. */
  owner: symbol | null
  status: SpeechStatus
  /** Okunan kısmın oranı (0–1). */
  progress: number
  voice: VoiceStatus
  /** Model inerken inen kısım (0–1); inmiyorsa `null`. */
  download: number | null
}

export const speechSupported = piperSupported || browserVoiceSupported

let state: SpeechState = {
  owner: null,
  status: 'idle',
  progress: 0,
  voice: piperSupported ? 'idle' : 'fallback',
  download: null,
}
const listeners = new Set<() => void>()

function update(next: Partial<SpeechState>) {
  state = { ...state, ...next }
  for (const listener of listeners) listener()
}

export function subscribeSpeech(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getSpeechState = () => state

onPiperDownload((fraction) => update({ download: fraction }))

let voiceReady: Promise<boolean> | null = null

/** Piper'ı hazırlar (model iner, yüklenir). Başarısızsa bu oturumda tarayıcı sesine geçilir. */
export function prepareVoice(): Promise<boolean> {
  if (state.voice === 'fallback') return Promise.resolve(false)
  voiceReady ??= (async () => {
    update({ voice: 'loading' })
    try {
      await preparePiper()
      update({ voice: 'ready', download: null })
      return true
    } catch (error) {
      console.warn('[speech] Piper kullanılamadı, tarayıcı sesine geçiliyor.', error)
      update({ voice: 'fallback', download: null })
      return false
    }
  })()
  return voiceReady
}

/** Her okuma artırır; geç biten eski iş (sentez, oynatma) yenisini bozmasın. */
let token = 0
let audio: HTMLAudioElement | null = null
let audioUrl: string | null = null

function release() {
  if (audio) {
    audio.onended = audio.onerror = audio.ontimeupdate = null
    audio.pause()
    audio = null
  }
  if (audioUrl) {
    URL.revokeObjectURL(audioUrl)
    audioUrl = null
  }
  cancelBrowserVoice()
}

function finish(myToken: number) {
  if (myToken !== token) return
  release()
  update({ owner: null, status: 'idle', progress: 0 })
}

/** Okumayı durdurur. `owner` verilirse yalnızca o bileşenin okumasını durdurur. */
export function stopSpeech(owner?: symbol) {
  if (owner && state.owner !== owner) return
  token++
  release()
  update({ owner: null, status: 'idle', progress: 0 })
}

function playWav(wav: Blob, myToken: number) {
  audioUrl = URL.createObjectURL(wav)
  const player = new Audio(audioUrl)
  audio = player
  player.ontimeupdate = () => {
    if (myToken === token && player.duration > 0) {
      update({ progress: Math.min(1, player.currentTime / player.duration) })
    }
  }
  player.onended = () => finish(myToken)
  player.onerror = () => finish(myToken)
  update({ status: 'speaking', progress: 0 })
  // Tarayıcı otomatik oynatmayı engellerse sessizce boşa düş.
  player.play().catch(() => finish(myToken))
}

function playWithBrowser(text: string, myToken: number) {
  update({ status: 'speaking', progress: 0 })
  speakWithBrowserVoice(text, {
    onProgress: (fraction) => {
      if (myToken === token) update({ progress: fraction })
    },
    onEnd: () => finish(myToken),
  })
}

export async function speak(owner: symbol, text: string) {
  const myToken = ++token
  release()
  const spoken = speechText(text)
  update({ owner, status: 'preparing', progress: 0 })

  if (await prepareVoice()) {
    if (myToken !== token) return
    try {
      const wav = await synthesizePiper(spoken)
      if (myToken === token) playWav(wav, myToken)
      return
    } catch (error) {
      console.warn('[speech] Piper bu metni okuyamadı, tarayıcı sesi kullanılıyor.', error)
    }
  }
  if (myToken === token) playWithBrowser(spoken, myToken)
}
