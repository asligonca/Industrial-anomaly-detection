import { useCameras } from '@/api/hooks/useCameras'

/** "N/M kamera çevrimiçi". Hata olursa gizlenir; menü ve sayfalar etkilenmez. */
export function OnlineIndicator() {
  const { data: cameras, isError } = useCameras()
  if (isError) return null

  const total = cameras?.length
  const online = cameras?.filter((c) => c.is_active).length
  // Yükleniyor: gri nokta. Hepsi aktif: yeşil. Biri bile kapalıysa (ya da kamera yoksa): turuncu.
  const allOnline = total !== undefined && total > 0 && online === total
  const dot = !cameras ? 'bg-zinc-300' : allOnline ? 'bg-ok' : 'bg-warn'

  return (
    <div className="flex h-[34px] items-center gap-2 whitespace-nowrap rounded-full border border-zinc-200 px-3 text-[13px] text-zinc-600">
      <span aria-hidden className={`size-[7px] rounded-full ${dot}`} />
      {online ?? '–'}/{total ?? '–'} kamera çevrimiçi
    </div>
  )
}
