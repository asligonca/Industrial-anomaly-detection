import { create } from 'zustand'

interface UiState {
  /** Sesli asistan paneli açık mı. Paneli FE-10 çizer; FE-4 yalnızca bayrağı tutar. */
  assistantOpen: boolean
  toggleAssistant: () => void
  closeAssistant: () => void
}

/** Kalıcı olmayan arayüz durumu (sayfa yenilenince sıfırlanır). */
export const useUiStore = create<UiState>()((set) => ({
  assistantOpen: false,
  toggleAssistant: () => set((state) => ({ assistantOpen: !state.assistantOpen })),
  closeAssistant: () => set({ assistantOpen: false }),
}))
