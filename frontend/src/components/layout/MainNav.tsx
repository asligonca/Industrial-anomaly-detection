import { useOpenEventCount } from '@/api/hooks/useOpenEventCount'
import { useAuthStore } from '@/store/auth'
import { Fragment } from 'react'
import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'

const linkBase =
  'flex h-[38px] flex-none items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-medium'

export function MainNav() {
  const role = useAuthStore((s) => s.user?.role)
  const openCount = useOpenEventCount()

  const visible = navItems.filter((item) => !item.role || item.role === role)
  const firstRoleItem = visible.find((item) => item.role)

  return (
    <nav aria-label="Ana menü" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
      {visible.map((item) => (
        <Fragment key={item.to}>
          {item === firstRoleItem && (
            <span aria-hidden className="mx-2 h-5 w-px flex-none bg-zinc-300" />
          )}
          <NavLink
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`
            }
          >
            {item.label}
            {item.openEventBadge && openCount !== undefined && openCount > 0 && (
              <span
                aria-label={`${openCount} açık olay`}
                className="grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-xs text-white"
              >
                {openCount}
              </span>
            )}
          </NavLink>
        </Fragment>
      ))}
    </nav>
  )
}
