import type { Camera, CameraUpdate } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCamera } from '../cameras'
import { queryKeys } from '../queryKeys'
import { invalidateWithAudit } from './invalidateWithAudit'

type UpdateVariables = CameraUpdate & { id: number }

/** Listede yalnızca verilen kameranın alanlarını değiştirir, diğerlerine dokunmaz. */
function patchCamera(cameras: Camera[] | undefined, id: number, fields: Partial<Camera>) {
  return cameras?.map((camera) => (camera.id === id ? { ...camera, ...fields } : camera))
}

/**
 * Kamerayı günceller. Ekran sunucuyu beklemeden değişir (anahtar hemen kayar); istek başarısız
 * olursa **yalnızca o kameranın** değişen alanları eski haline döner. Tüm listenin eski kopyası
 * geri konmaz: aynı anda değiştirilen başka bir kameranın iyimser hali silinmesin.
 * Sonunda liste her durumda sunucudan yeniden çekilir.
 */
export function useUpdateCamera() {
  const queryClient = useQueryClient()
  const key = queryKeys.cameras.all
  return useMutation({
    mutationFn: ({ id, ...update }: UpdateVariables) => updateCamera(id, update),
    onMutate: async ({ id, ...update }) => {
      // Yolda olan eski bir GET, iyimser değişikliğin üstüne yazmasın.
      await queryClient.cancelQueries({ queryKey: key })
      const camera = queryClient.getQueryData<Camera[]>(key)?.find((c) => c.id === id)
      // Geri almak için yalnızca değişen alanların eski değerleri.
      const previous = camera
        ? Object.fromEntries(
            Object.keys(update).map((field) => [field, camera[field as keyof Camera]]),
          )
        : null
      queryClient.setQueryData<Camera[]>(key, (cameras) => patchCamera(cameras, id, update))
      return { previous }
    },
    onError: (_error, { id }, result) => {
      if (result?.previous) {
        queryClient.setQueryData<Camera[]>(key, (cameras) =>
          patchCamera(cameras, id, result.previous as Partial<Camera>),
        )
      }
    },
    onSettled: () => invalidateWithAudit(queryClient, key),
  })
}
