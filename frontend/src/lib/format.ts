const pad = (n: number) => String(n).padStart(2, '0')

const formatDay = (date: Date) =>
  `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`

/** Yerel saatle "SS:DD:SS" (13:02:17). */
export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** Yerel saatle "GG.AA.YYYY SS:DD:SS" (03.11.2026 13:02:17). */
export function formatDateTime(date: Date): string {
  return `${formatDay(date)} ${formatTime(date)}`
}

/** Bugünse yalnızca saat, değilse tarih + saat. Olay listesi gibi çoğu kaydı bugün olan yerler için. */
export function formatEventTime(date: Date, now: Date = new Date()): string {
  return formatDay(date) === formatDay(now) ? formatTime(date) : formatDateTime(date)
}

/** Model güven skoru, tasarımdaki gibi iki ondalık: 0.912 -> "0,91". */
export function formatConfidence(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

/** Süre: 1200 -> "1,2 sn". */
export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace('.', ',')} sn`
}
