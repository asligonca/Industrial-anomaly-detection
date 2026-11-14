import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  /** Sağ üstte duran eylemler (düğme, filtre). */
  actions?: ReactNode
}

/** Sayfa başlığı (h1), isteğe bağlı açıklama ve eylem alanı. Her sayfa bunu kullanır. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-zinc-600">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
