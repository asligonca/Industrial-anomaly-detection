import { useCreateCamera } from '@/api/hooks/useCreateCamera'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import type { CameraCreate } from '@/types'
import { useId, useState } from 'react'

type RequiredField = 'name' | 'stream_url' | 'area'

/** Boş bırakılamayan alanlar, ekrandaki sırayla (ilk hatalı alana odaklanmak için). */
const requiredFields: RequiredField[] = ['name', 'stream_url', 'area']

const requiredMessages: Record<RequiredField, string> = {
  name: 'Kamera adını girin.',
  stream_url: 'Yayın adresini girin.',
  area: 'Alanı girin.',
}

type FieldErrors = Partial<Record<RequiredField, string>>

interface CameraAddDialogProps {
  open: boolean
  onClose: () => void
  /** Var olan alanlar: öneri olarak çıkar, yeni alan da yazılabilir. */
  areas: string[]
}

/** "Kamera ekle" penceresi. Yeni kamera aktif olarak eklenir. */
export function CameraAddDialog({ open, onClose, areas }: CameraAddDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Kamera ekle"
      description="Kamera aktif olarak eklenir; canlı izlemede hemen görünür. Alan, canlı izlemedeki gruptur."
    >
      <CameraForm areas={areas} onDone={onClose} />
    </Dialog>
  )
}

function CameraForm({ areas, onDone }: { areas: string[]; onDone: () => void }) {
  const create = useCreateCamera()
  const [errors, setErrors] = useState<FieldErrors>({})
  const areaListId = useId()

  function submit(form: HTMLFormElement) {
    const data = new FormData(form)
    const text = (key: string) => String(data.get(key) ?? '').trim()
    const camera: CameraCreate = {
      name: text('name'),
      location: text('location'),
      stream_url: text('stream_url'),
      area: text('area'),
    }

    const missing = requiredFields.filter((field) => !camera[field])
    setErrors(Object.fromEntries(missing.map((field) => [field, requiredMessages[field]])))
    const [first] = missing
    if (first) {
      form.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus()
      return
    }
    create.mutate(camera, { onSuccess: onDone })
  }

  const clearError = (field: RequiredField) =>
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit(e.currentTarget)
      }}
      className="flex flex-col gap-4"
    >
      <Input
        label="Kamera adı"
        name="name"
        autoComplete="off"
        data-autofocus
        error={errors.name}
        onChange={() => clearError('name')}
      />
      <Input label="Konum (isteğe bağlı)" name="location" autoComplete="off" />
      <Input
        label="Yayın adresi"
        name="stream_url"
        placeholder="rtsp://10.0.1.17/stream"
        autoComplete="off"
        spellCheck={false}
        error={errors.stream_url}
        onChange={() => clearError('stream_url')}
      />
      <Input
        label="Alan"
        name="area"
        placeholder="Üretim, Depo…"
        list={areaListId}
        autoComplete="off"
        error={errors.area}
        onChange={() => clearError('area')}
      />
      <datalist id={areaListId}>
        {areas.map((area) => (
          <option key={area} value={area} />
        ))}
      </datalist>

      {create.isError && (
        <p role="alert" className="text-[13px] text-danger">
          Kamera eklenemedi: {create.error.message}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="md" onClick={onDone}>
          Vazgeç
        </Button>
        <Button type="submit" size="md" disabled={create.isPending}>
          {create.isPending ? 'Ekleniyor…' : 'Ekle'}
        </Button>
      </div>
    </form>
  )
}
