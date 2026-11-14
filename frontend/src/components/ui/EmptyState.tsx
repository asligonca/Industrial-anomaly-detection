import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  /** Sonraki adım için düğme ya da bağlantı. */
  action?: ReactNode
}

/** Gösterilecek veri yokken ya da ekran henüz hazır değilken kullanılan boş durum. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-card border border-dashed border-zinc-300 px-6 py-12 text-center">
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="max-w-[42ch] text-sm text-zinc-600">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
