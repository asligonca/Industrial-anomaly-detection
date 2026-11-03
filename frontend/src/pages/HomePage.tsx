import { endSession } from '@/features/auth/session'
import { roleLabels } from '@/lib/labels'
import { useAuthStore } from '@/store/auth'

/** Geçici ana ekran. Canlı izleme (FE-5) ve üst bar (FE-4) bunu değiştirecek. */
export function HomePage() {
  const user = useAuthStore((s) => s.user)

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Canlı izleme</h1>
      {user && (
        <p className="mt-2 text-zinc-600">
          Giriş yapıldı: <strong>{user.username}</strong> ({roleLabels[user.role]})
        </p>
      )}
      <button
        type="button"
        onClick={endSession}
        className="mt-6 h-10 rounded-[10px] bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Çıkış yap
      </button>
    </main>
  )
}
