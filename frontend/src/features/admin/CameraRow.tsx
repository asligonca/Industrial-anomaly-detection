import { useUpdateCamera } from '@/api/hooks/useUpdateCamera'
import { Switch } from '@/components/ui/Switch'
import { cn } from '@/lib/cn'
import type { Camera } from '@/types'
import { adminRowClass, inlineErrorClass } from './adminStyles'

/**
 * Kamera satırı: kod, ad, yayın adresi ve aktif / pasif anahtarı. Anahtar sunucuyu beklemeden
 * kayar; kayıt başarısız olursa eski haline döner ve satırda hata yazar.
 * Dar ekranda bilgiler alt alta, anahtar sağda; geniş ekranda tasarımdaki dört sütun.
 */
export function CameraRow({ camera }: { camera: Camera }) {
  const update = useUpdateCamera()
  // Kod ve maskeli adres (parola "***") backend'den gelir.
  const { code, stream_url: url } = camera

  return (
    <li
      className={adminRowClass(
        'flex items-center gap-4 sm:grid sm:grid-cols-[80px_minmax(0,1fr)_minmax(0,1.3fr)_auto]',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:contents">
        <span className="font-mono text-[12px] text-zinc-500">{code}</span>
        <span className={cn('font-medium', !camera.is_active && 'text-zinc-500')}>
          {camera.name}
        </span>
        <span title={url} className="truncate font-mono text-[12px] text-zinc-500">
          {url}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Switch
          checked={camera.is_active}
          busy={update.isPending}
          onCheckedChange={(isActive) => update.mutate({ id: camera.id, is_active: isActive })}
          aria-label={`${code} ${camera.name} yayını`}
        />
        {update.isError && (
          <p role="alert" title={update.error.message} className={inlineErrorClass}>
            Kaydedilemedi
          </p>
        )}
      </div>
    </li>
  )
}
