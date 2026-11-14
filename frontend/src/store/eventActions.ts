import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/** Olay detayındaki önerilen aksiyonlar. Şimdilik yalnızca arayüz: backend'e gitmez. */
export type SuggestedActionKey = 'notify' | 'announce' | 'lock'

interface EventActionsState {
  /** Olay id'si -> yapıldı işaretlenen aksiyonlar. JSON anahtarı olduğu için id string. */
  done: Record<string, SuggestedActionKey[]>
  markDone: (eventId: number, action: SuggestedActionKey) => void
}

/**
 * "Yapıldı" işaretleri bu tarayıcıda hatırlanır (localStorage `event-actions`), sayfa yenilense de
 * kalır. Başka cihaz ya da kullanıcı görmez; aksiyonlar backend'e bağlanınca bu store kalkar.
 */
export const useEventActionsStore = create<EventActionsState>()(
  persist(
    (set) => ({
      done: {},
      markDone: (eventId, action) =>
        set((state) => {
          const key = String(eventId)
          const current = state.done[key] ?? []
          if (current.includes(action)) return state
          return { done: { ...state.done, [key]: [...current, action] } }
        }),
    }),
    {
      name: 'event-actions',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ done: state.done }),
    },
  ),
)
