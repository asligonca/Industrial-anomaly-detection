import { Logo } from '@/components/Logo'
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

const inputClass =
  'h-11 rounded-[10px] border border-zinc-300 bg-white px-3.5 text-[15px] text-zinc-900 outline-none focus:border-zinc-900'

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
      <div className="flex w-full max-w-[400px] flex-col gap-7 rounded-[20px] border border-zinc-200 bg-white p-9">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <div className="text-xl font-bold tracking-[0.14em]">SAURON</div>
              <div className="text-xs text-zinc-500">Güvenlik Kontrol Merkezi</div>
            </div>
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight">Giriş yap</h1>
        </div>

        <div role="tablist" className="flex rounded-[10px] bg-zinc-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.role}
              type="button"
              role="tab"
              aria-selected={t.role === tab.role}
              onClick={() => selectTab(t)}
              className={`h-[38px] flex-1 rounded-[7px] text-sm font-medium ${
                t.role === tab.role ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[13px] text-zinc-500">
            Kullanıcı adı
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                login.reset()
              }}
              autoComplete="username"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] text-zinc-500">
            Parola
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                login.reset()
              }}
              autoComplete="current-password"
              className={inputClass}
            />
          </label>
          {login.error && (
            <div role="alert" className="text-[13px] text-danger">
              {loginErrorMessage(login.error)}
            </div>
          )}
          <button
            type="submit"
            disabled={login.isPending}
            className="h-[46px] rounded-[10px] bg-zinc-900 text-[15px] font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
          >
            {tab.submitLabel}
          </button>
        </form>

        <p className="text-xs text-zinc-400">Demo sürümü. Hesap bilgileri önceden dolduruldu.</p>
      </div>
    </main>
  )
}
