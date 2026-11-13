/** Bir gündeki saat sayısı: saatlik grafik ve `by_hour` her zaman bu kadar kayıt. */
export const HOURS_PER_DAY = 24

/** 7 -> "07" (saat, dakika, gün, ay). */
export const twoDigits = (n: number) => String(n).padStart(2, '0')

/** Yerel tarihle "GG.AA.YYYY" (03.11.2026). */
export const formatDay = (date: Date) =>
  `${twoDigits(date.getDate())}.${twoDigits(date.getMonth() + 1)}.${date.getFullYear()}`

/** Yerel tarihle "YYYY-MM-DD": `<input type="date">` değeri ve adres çubuğundaki tarih. */
export const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`

/** İki an aynı yerel günde mi? */
export const isSameDay = (a: Date, b: Date) => toDateInputValue(a) === toDateInputValue(b)

/** Yerel saatle "SS:DD:SS" (13:02:17). */
export function formatTime(date: Date): string {
  return `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}:${twoDigits(date.getSeconds())}`
}

/** Yerel saatle "GG.AA.YYYY SS:DD:SS" (03.11.2026 13:02:17). */
export function formatDateTime(date: Date): string {
  return `${formatDay(date)} ${formatTime(date)}`
}

/** Bugünse yalnızca saat, değilse tarih + saat. Olay listesi gibi çoğu kaydı bugün olan yerler için. */
export function formatEventTime(date: Date, now: Date = new Date()): string {
  return isSameDay(date, now) ? formatTime(date) : formatDateTime(date)
}

/** Model güven skoru, tasarımdaki gibi iki ondalık: 0.912 -> "0,91". */
export function formatConfidence(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

/** Süre: 1200 -> "1,2 sn". */
export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace('.', ',')} sn`
}

/** Yerel saatle "SS:DD" (09:04). */
export function formatHourMinute(date: Date): string {
  return `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`
}

/**
 * Gün adıyla kısa zaman: "Bugün 09:04", "Dün 22:10", daha eskiyse "12.11.2026 08:30".
 * Kullanıcıların son girişi ve denetim kayıtları gibi birkaç güne yayılan listeler için.
 */
export function formatRelativeDayTime(date: Date, now: Date): string {
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const day = isSameDay(date, now) ? 'Bugün' : isSameDay(date, yesterday) ? 'Dün' : formatDay(date)
  return `${day} ${formatHourMinute(date)}`
}
