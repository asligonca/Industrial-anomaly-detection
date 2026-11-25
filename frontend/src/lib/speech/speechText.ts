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

/** Piper modeli inerken gösterilen metin: 0.42 -> "Ses hazırlanıyor… %42". */
export function voiceDownloadText(download: number): string {
  return `Ses hazırlanıyor… %${Math.round(download * 100)}`
}
