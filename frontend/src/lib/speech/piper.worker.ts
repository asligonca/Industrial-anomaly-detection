/// <reference lib="webworker" />
import { TtsSession } from '@mintplex-labs/piper-tts-web'
import { PIPER_VOICE_ID, type PiperRequest, type PiperResponse } from './piperProtocol'

/**
 * Piper'ı ayrı iş parçacığında çalıştırır: model yükleme ve ses üretimi sayfayı dondurmasın.
 * Model ve WASM dosyaları paketin varsayılan adreslerinden iner (huggingface.co, jsdelivr,
 * cdnjs) ve tarayıcının kalıcı deposunda (OPFS) saklanır. Geçici çözüm: kalıcısı backend'de
 * `POST /api/tts` (backend-notlari madde 38).
 */
const scope = self as unknown as DedicatedWorkerGlobalScope
const post = (message: PiperResponse) => scope.postMessage(message)

/** Çıkarım ilerlemesi de aynı geri çağırmayla gelir; yalnızca dosya indirmesini ilet. */
const INFERENCE_URL = 'tts://inference-progress'

let session: Promise<TtsSession> | null = null

function getSession(): Promise<TtsSession> {
  session ??= TtsSession.create({
    voiceId: PIPER_VOICE_ID,
    progress: ({ url, loaded, total }) => {
      if (url !== INFERENCE_URL && url.endsWith('.onnx') && total > 0) {
        post({ type: 'download', fraction: Math.min(1, loaded / total) })
      }
    },
  })
  return session
}

scope.onmessage = async ({ data }: MessageEvent<PiperRequest>) => {
  try {
    const tts = await getSession()
    if (data.type === 'prepare') post({ id: data.id, type: 'ready' })
    else post({ id: data.id, type: 'audio', wav: await tts.predict(data.text) })
  } catch (error) {
    // Paket tek örnek tutar ve hatalı örneği geri verir; sonraki denemede baştan kurulsun.
    session = null
    TtsSession._instance = null
    post({
      id: data.id,
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
