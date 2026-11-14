/** Koşullu sınıf adlarını birleştirir. Yanlış/boş değerler atlanır. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
