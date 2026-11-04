const pad = (n: number) => String(n).padStart(2, '0')

/** Yerel saatle "GG.AA.YYYY SS:DD:SS" (03.11.2026 13:02:17). */
export function formatDateTime(date: Date): string {
  const day = `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  return `${day} ${time}`
}
