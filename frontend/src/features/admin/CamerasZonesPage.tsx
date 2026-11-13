import { PageHeader } from '@/components/ui/PageHeader'
import { CameraSection } from './CameraSection'
import { ZoneSection } from './ZoneSection'

/** Yönetici: kameralar (aktif / pasif, ekleme) ve bölgeler (ekleme, silme). */
export function CamerasZonesPage() {
  return (
    <section className="flex max-w-[960px] flex-col gap-8">
      <PageHeader title="Kameralar ve bölgeler" />
      <CameraSection />
      <ZoneSection />
    </section>
  )
}
