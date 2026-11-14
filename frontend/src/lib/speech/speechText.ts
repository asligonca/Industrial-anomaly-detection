/**
 * Ekran metnini okunacak metne çevirir. Kodlar harf harf okunmasın:
 * "OLY-014" -> "olay 14", "KAM-03" -> "kamera 3"; "·" ayırıcısı duraklama olur.
 */
export function speechText(text: string): string {
  return text
    .replace(/\bOLY-0*(\d+)\b/g, 'olay $1')
    .replace(/\bKAM-0*(\d+)\b/g, 'kamera $1')
    .replace(/\s*·\s*/g, ', ')
}
