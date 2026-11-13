import { ApiError } from '@/api/client'
import { useCreateUser } from '@/api/hooks/useCreateUser'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { roleLabels, roles } from '@/lib/labels'
import type { Role } from '@/types'
import { useState } from 'react'

/** Backend kuralı (backend-notlari madde 28). */
const MIN_PASSWORD_LENGTH = 8

type Field = 'username' | 'password'
type FieldErrors = Partial<Record<Field, string>>

interface UserAddDialogProps {
  open: boolean
  onClose: () => void
}

/** "Kullanıcı ekle" penceresi: kullanıcı adı, parola, rol. */
export function UserAddDialog({ open, onClose }: UserAddDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Kullanıcı ekle"
      description="Kullanıcı bu ad ve parolayla giriş yapar."
    >
      <UserForm onDone={onClose} />
    </Dialog>
  )
}

function UserForm({ onDone }: { onDone: () => void }) {
  const create = useCreateUser()
  const [errors, setErrors] = useState<FieldErrors>({})

  function submit(form: HTMLFormElement) {
    const data = new FormData(form)
    const username = String(data.get('username') ?? '').trim()
    const password = String(data.get('password') ?? '')
    const role = String(data.get('role')) as Role

    const next: FieldErrors = {}
    if (!username) next.username = 'Kullanıcı adını girin.'
    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Parola en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`
    }
    setErrors(next)
    const first = (['username', 'password'] as const).find((field) => next[field])
    if (first) {
      form.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus()
      return
    }

    create.mutate(
      { username, password, role },
      {
        onSuccess: onDone,
        onError: (error) => {
          // Aynı ad: hatayı alanın altında göster ve alana dön.
          if (error instanceof ApiError && error.status === 409) {
            setErrors({ username: 'Bu kullanıcı adı zaten var.' })
            form.querySelector<HTMLInputElement>('[name="username"]')?.focus()
          }
        },
      },
    )
  }

  const clearError = (field: Field) =>
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))

  const conflict = create.error instanceof ApiError && create.error.status === 409

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
        label="Kullanıcı adı"
        name="username"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        data-autofocus
        error={errors.username}
        onChange={() => clearError('username')}
      />
      <Input
        label="Parola"
        name="password"
        type="password"
        autoComplete="new-password"
        error={errors.password}
        onChange={() => clearError('password')}
      />
      <Select label="Rol" name="role" defaultValue={'operator' satisfies Role}>
        {roles.map((role) => (
          <option key={role} value={role}>
            {roleLabels[role]}
          </option>
        ))}
      </Select>

      {create.isError && !conflict && (
        <p role="alert" className="text-[13px] text-danger">
          Kullanıcı eklenemedi: {create.error.message}
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
