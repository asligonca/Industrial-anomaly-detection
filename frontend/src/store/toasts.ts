import { create } from 'zustand'

/** `critical`: kırmızı kenar (kritik olay). */
export type ToastTone = 'info' | 'critical'

export interface Toast {
  id: number
  title: string
  description?: string
  /** Varsa "Aç" bağlantısı (ör. `/events/15`). */
  href?: string
  tone: ToastTone
}

/** Aynı anda en çok bu kadar bildirim görünür; fazlası en eskiden atılır. */
const MAX_TOASTS = 4

interface ToastState {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: number) => void
  clear: () => void
}

let nextId = 1

/** Ekranın köşesindeki kısa bildirimler (yeni olay gibi). Kalıcı değil. */
export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (toast) =>
    set((state) => ({ toasts: [...state.toasts, { ...toast, id: nextId++ }].slice(-MAX_TOASTS) })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}))
