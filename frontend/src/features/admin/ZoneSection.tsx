import { useCameras } from '@/api/hooks/useCameras'
import { useZones } from '@/api/hooks/useZones'
import { ErrorBox } from '@/components/ui/ErrorBox'
import { Skeleton } from '@/components/ui/Skeleton'
import { cameraCode } from '@/lib/labels'
import { useEffect, useId, useMemo, useRef } from 'react'
import { adminEmptyClass, adminListClass, adminRowClass, SKELETON_ROWS } from './adminStyles'
import { ZoneAddForm } from './ZoneAddForm'
import { ZoneRow } from './ZoneRow'

/** Bölgeler listesi (sil) ve altında ekleme satırı. */
export function ZoneSection() {
  const zones = useZones()
  const cameras = useCameras()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const headingId = useId()

  const cameraNames = useMemo(
    () => new Map(cameras.data?.map((camera) => [camera.id, camera.name])),
    [cameras.data],
  )

  // Silinen satır kaybolunca odak sayfanın başına düşmesin, başlığa gelsin. Satırın kendi
  // onSuccess'i bu anda çalışmaz: liste yenilenince satır zaten çizilmez (HANDOFF-FE-8, 5.6).
  const deletedId = useRef<number | null>(null)
  useEffect(() => {
    const id = deletedId.current
    if (id === null || !zones.data || zones.data.some((zone) => zone.id === id)) return
    deletedId.current = null
    headingRef.current?.focus()
  }, [zones.data])

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} ref={headingRef} tabIndex={-1} className="text-base font-semibold">
        Bölgeler
      </h2>

      {zones.isError ? (
        <ErrorBox message="Bölgeler yüklenemedi." onRetry={() => void zones.refetch()} />
      ) : (
        <div className={adminListClass}>
          <ul aria-busy={zones.isPending}>
            {zones.data === undefined ? (
              Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <li key={i} className={adminRowClass()}>
                  <Skeleton className="h-6" />
                </li>
              ))
            ) : zones.data.length === 0 ? (
              <li className={adminEmptyClass}>Tanımlı bölge yok</li>
            ) : (
              zones.data.map((zone) => (
                <ZoneRow
                  key={zone.id}
                  zone={zone}
                  cameraName={cameraNames.get(zone.camera_id) ?? cameraCode(zone.camera_id)}
                  onDeleteStart={(id) => {
                    deletedId.current = id
                  }}
                />
              ))
            )}
          </ul>
          <ZoneAddForm cameras={cameras.data} />
        </div>
      )}
    </section>
  )
}
