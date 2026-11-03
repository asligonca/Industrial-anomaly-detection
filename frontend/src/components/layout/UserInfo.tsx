import { endSession } from '@/features/auth/session'
import { roleLabels } from '@/lib/labels'
import { useAuthStore } from '@/store/auth'

/** Avatar, kullanıcı adı, rol etiketi ve çıkış düğmesi. */
export function UserInfo() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2.5">
        <div
          aria-hidden
          className="grid size-9 place-items-center rounded-full bg-zinc-100 text-[13px] font-bold"
        >
          {user.username.slice(0, 2).toUpperCase()}
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold">{user.username}</div>
          <div className="text-xs text-zinc-500">{roleLabels[user.role]}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={endSession}
        className="h-[34px] rounded-lg border border-zinc-300 bg-white px-3 text-[13px] hover:bg-zinc-100"
      >
        Çıkış
      </button>
    </div>
  )
}
