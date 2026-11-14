/**
 * Piper sesi: Türkçe, tek konuşmacı, 22 kHz (model 63 MB).
 * Ses verisi lisansı CC BY-NC-SA 4.0 (DFKI / MaryTTS `dfki-ot-data`): ticari kullanım yok, kaynak
 * gösterilmeli (README).
 */
export const PIPER_VOICE_ID = 'tr_TR-dfki-medium'

/** Sayfa -> worker. `prepare`: modeli indir ve yükle (konuşmadan). */
export type PiperRequest =
  { id: number; type: 'prepare' } | { id: number; type: 'speak'; text: string }

/** Worker -> sayfa. `download`: modelin inen kısmı (0–1), hangi istek tetiklediyse. */
export type PiperResponse =
  | { type: 'download'; fraction: number }
  | { id: number; type: 'ready' }
  | { id: number; type: 'audio'; wav: Blob }
  | { id: number; type: 'error'; message: string }
