/**
 * `public/` altındaki dosyanın tam adresi: 'assets/cam-1.png' -> 'http://localhost:5173/assets/cam-1.png'.
 * Tam adres gerekir, çünkü görüntü adresleri API tabanına göre çözülür (bkz. `withToken`).
 * BASE_URL ("/" ya da alt yol) sonda "/" taşır; uygulama alt yoldan yayınlansa da dosya bulunur.
 */
export function publicAssetUrl(path: string): string {
  return new URL(`${import.meta.env.BASE_URL}${path}`, window.location.origin).href
}
