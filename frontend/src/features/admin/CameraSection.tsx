import { useCameras } from '@/api/hooks/useCameras'
import { Button } from '@/components/ui/Button'
import { ErrorBox } from '@/components/ui/ErrorBox'
import { Skeleton } from '@/components/ui/Skeleton'
import { cameraAreas } from '@/lib/cameraAreas'
import { useId, useMemo, useState } from 'react'
import { adminEmptyClass, adminListClass, adminRowClass, SKELETON_ROWS } from './adminStyles'
import { CameraAddDialog } from './CameraAddDialog'
import { CameraRow } from './CameraRow'

/** Kameralar listesi, aktif / pasif anahtarı ve "Kamera ekle". */
export function CameraSection() {
  const cameras = useCameras()
  const [adding, setAdding] = useState(false)
  const headingId = useId()
  const areas = useMemo(() => cameraAreas(cameras.data ?? []), [cameras.data])

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-base font-semibold">
          Kameralar
        </h2>
        <Button size="sm" onClick={() => setAdding(true)}>
          Kamera ekle
        </Button>
      </div>

      {cameras.isError ? (
        <ErrorBox message="Kameralar yüklenemedi." onRetry={() => void cameras.refetch()} />
      ) : (
        <ul aria-busy={cameras.isPending} className={adminListClass}>
          {cameras.data === undefined ? (
            Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <li key={i} className={adminRowClass()}>
                <Skeleton className="h-6" />
              </li>
            ))
          ) : cameras.data.length === 0 ? (
            <li className={adminEmptyClass}>Kayıtlı kamera yok</li>
          ) : (
            cameras.data.map((camera) => <CameraRow key={camera.id} camera={camera} />)
          )}
        </ul>
      )}

      <CameraAddDialog open={adding} onClose={() => setAdding(false)} areas={areas} />
    </section>
  )
}
