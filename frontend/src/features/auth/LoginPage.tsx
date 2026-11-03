import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth'
import type { Role } from '@/types'
import { useState, type SyntheticEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { startSession } from './session'
import { loginErrorMessage, useLogin } from './useLogin'

const tabs: { role: Role; label: string; username: string; submitLabel: string }[] = [
  {
    role: 'operator',
    label: 'Operatör',
    username: 'operator1',
    submitLabel: 'Operatör olarak giriş yap',
  },
  { role: 'admin', label: 'Admin', username: 'admin', submitLabel: 'Admin olarak giriş yap' },
]

const DEMO_PASSWORD = '1234'

type Tab = (typeof tabs)[number]

export function LoginPage() {
  const token = useAuthStore((s) => s.token)
  // Çıkıştan sonra son kullanılan rolün sekmesi açılır; ilk girişte Operatör.
  const [tab, setTab] = useState<Tab>(
    () => tabs.find((t) => t.role === useAuthStore.getState().lastRole) ?? tabs[0]!,
  )
  const [username, setUsername] = useState(tab.username)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const login = useLogin()

  // Zaten girişli kullanıcı (ya da giriş az önce başarılı oldu): ana ekrana.
  if (token) return <Navigate to="/" replace />

  function selectTab(next: Tab) {
    setTab(next)
    setUsername(next.username)
    setPassword(DEMO_PASSWORD)
    login.reset()
  }

  function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    login.mutate(
      { username, password, role: tab.role },
      { onSuccess: ({ access_token, user }) => startSession(access_token, user) },
    )
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-100 p-6">
      <Card radius="panel" padding="lg" className="flex w-full max-w-[400px] flex-col gap-7">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <div className="text-xl font-bold tracking-[0.14em]">SENTRA</div>
              <div className="text-xs text-zinc-500">Endüstriyel İzleme Merkezi</div>
            </div>
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight">Giriş yap</h1>
        </div>

        <div role="tablist" className="flex rounded-control bg-zinc-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.role}
              type="button"
              role="tab"
              aria-selected={t.role === tab.role}
              onClick={() => selectTab(t)}
              className={`h-[38px] flex-1 rounded-[7px] text-sm font-medium ${
                t.role === tab.role ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Kullanıcı adı"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              login.reset()
            }}
            autoComplete="username"
          />
          <Input
            label="Parola"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              login.reset()
            }}
            autoComplete="current-password"
          />
          {login.error && (
            <div role="alert" className="text-[13px] text-danger">
              {loginErrorMessage(login.error)}
            </div>
          )}
          <Button type="submit" disabled={login.isPending}>
            {tab.submitLabel}
          </Button>
        </form>

        <p className="text-xs text-zinc-500">Demo sürümü. Hesap bilgileri önceden dolduruldu.</p>
      </Card>
    </main>
  )
}
