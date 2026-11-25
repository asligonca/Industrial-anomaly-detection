import type { AssistantAction } from '@/types'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Önerinin durumu: onay bekliyor, kaydediliyor, uygulandı, vazgeçildi, kaydedilemedi (yeniden
 * denenebilir), olayın durumu bu arada değişmiş (409; yeniden denemek hep 409 olur, kapanır).
 */
export type ProposalState = 'pending' | 'saving' | 'done' | 'dismissed' | 'failed' | 'stale'

/** Bir öneriyi bulmak için: hangi mesajın kaçıncı önerisi. */
export interface ProposalRef {
  messageId: number
  index: number
}

export interface AssistantProposal extends AssistantAction {
  state: ProposalState
}

export interface AssistantMessage {
  id: number
  from: 'bot' | 'user'
  text: string
  /** Asistanın önerdiği işlemler. Yalnızca kullanıcı onaylarsa uygulanır. */
  proposals: AssistantProposal[]
}

const greeting: AssistantMessage = {
  id: 0,
  from: 'bot',
  text: 'Merhaba. Olaylar, kameralar ve mevzuat hakkında sorabilirsiniz.',
  proposals: [],
}

interface AssistantState {
  messages: AssistantMessage[]
  /** Yanıtlar sesli okunsun mu. Bu tarayıcıda hatırlanır. */
  voiceEnabled: boolean
  addMessage: (from: AssistantMessage['from'], text: string, actions?: AssistantAction[]) => void
  setProposalState: (ref: ProposalRef, state: ProposalState) => void
  setVoiceEnabled: (enabled: boolean) => void
  /** Çıkışta: konuşma silinir, ses tercihi kalır. */
  resetConversation: () => void
}

let nextId = 1

/**
 * Sesli asistan konuşması. Panel kapanıp açılınca konuşma durur; sayfa yenilenince ya da çıkışta
 * silinir. Ses tercihi localStorage'da (`assistant-voice`).
 */
export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      messages: [greeting],
      voiceEnabled: true,
      addMessage: (from, text, actions = []) =>
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id: nextId++,
              from,
              text,
              proposals: actions.map((a) => ({ ...a, state: 'pending' })),
            },
          ],
        })),
      setProposalState: ({ messageId, index }, state) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === messageId
              ? { ...m, proposals: m.proposals.map((p, i) => (i === index ? { ...p, state } : p)) }
              : m,
          ),
        })),
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
      resetConversation: () => set({ messages: [greeting] }),
    }),
    {
      name: 'assistant-voice',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ voiceEnabled: s.voiceEnabled }),
    },
  ),
)
