/** Fixture saatlerini bugünün tarihine bağlar: atDay(0, '13:02:17') -> bugün 13:02:17 (ISO). */
export function atDay(daysAgo: number, time: string): string {
  const [h = 0, m = 0, s = 0] = time.split(':').map(Number)
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(h, m, s, 0)
  return d.toISOString()
}

export const today = (time: string) => atDay(0, time)
