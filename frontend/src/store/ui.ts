import { create } from 'zustand'

interface UiState {
  /** Sesli asistan paneli açık mı (`features/assistant`). */
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
