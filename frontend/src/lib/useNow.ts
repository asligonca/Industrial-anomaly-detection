import { useSyncExternalStore } from 'react'

/*
 * Ekrandaki tüm saatler tek bir zamanlayıcıyı paylaşır: 6 kamera kartı 6 ayrı interval açmaz,
 * hepsi aynı anda ve saniye başında güncellenir. Dinleyen kalmayınca zamanlayıcı durur.
 */
let now = Date.now()
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

/** Bir sonraki tam saniyeye kadar bekler; setInterval gibi kayma biriktirmez. */
function schedule() {
  timer = setTimeout(tick, 1000 - (Date.now() % 1000))
}

function tick() {
  now = Date.now()
  listeners.forEach((listener) => listener())
  schedule()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (timer === undefined) {
    // Uzun süre dinleyen olmadıysa eski değer kalmasın.
    now = Date.now()
    schedule()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearTimeout(timer)
      timer = undefined
    }
  }
}

const getSnapshot = () => now

/** Saniyede bir güncellenen şimdiki zaman (ms). Yalnızca bunu kullanan bileşen yeniden çizilir. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot)
}
