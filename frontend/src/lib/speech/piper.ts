import type { PiperRequest, PiperResponse } from './piperProtocol'

/** Worker ve OPFS (modelin saklandığı yer) yoksa Piper çalışmaz; tarayıcı sesi kullanılır. */
export const piperSupported =
  typeof Worker !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  typeof navigator.storage?.getDirectory === 'function'

interface Pending {
  resolve: (value: Blob | null) => void
  reject: (error: Error) => void
}

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, Pending>()
let onDownload: ((fraction: number) => void) | null = null

function failAll(error: Error) {
  for (const request of pending.values()) request.reject(error)
  pending.clear()
}

function getWorker(): Worker {
  if (worker) return worker
  const created = new Worker(new URL('./piper.worker.ts', import.meta.url), { type: 'module' })
  created.onmessage = ({ data }: MessageEvent<PiperResponse>) => {
    if (data.type === 'download') {
      onDownload?.(data.fraction)
      return
    }
    const request = pending.get(data.id)
    if (!request) return
    pending.delete(data.id)
    if (data.type === 'error') request.reject(new Error(data.message))
    else request.resolve(data.type === 'audio' ? data.wav : null)
  }
  // Worker hiç açılamadı (betik inmedi vb.): bekleyenler düşer, sonraki istek yeniden dener.
  created.onerror = (event) => {
    event.preventDefault()
    failAll(new Error(event.message || 'Piper worker açılamadı'))
    created.terminate()
    worker = null
  }
  worker = created
  return created
}

/** `Omit` birleşim tipine dağılmaz; her üye için ayrı. */
type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never

function send(request: WithoutId<PiperRequest>): Promise<Blob | null> {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    getWorker().postMessage({ ...request, id } as PiperRequest)
  })
}

/** Model indirme ilerlemesini dinle (0–1). Tek dinleyici: oynatıcı. */
export function onPiperDownload(listener: (fraction: number) => void) {
  onDownload = listener
}

/** Modeli önceden indir ve yükle; ilk okuma beklemesin. */
export async function preparePiper(): Promise<void> {
  await send({ type: 'prepare' })
}

/** Metni WAV'a çevirir. İlk çağrıda model iner (63 MB, sonra önbellekten). */
export async function synthesizePiper(text: string): Promise<Blob> {
  const wav = await send({ type: 'speak', text })
  if (!wav) throw new Error('Piper ses üretmedi')
  return wav
}
