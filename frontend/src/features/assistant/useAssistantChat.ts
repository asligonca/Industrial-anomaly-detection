import { isConflict } from '@/api/client'
import { useAssistantQuery } from '@/api/hooks/useAssistantQuery'
import { useUpdateEventStatus } from '@/api/hooks/useUpdateEventStatus'
import { assistantActions } from '@/lib/eventRules'
import { eventCode } from '@/lib/labels'
import { useSpeech } from '@/lib/speech/useSpeech'
import { useAssistantStore, type AssistantProposal, type ProposalRef } from '@/store/assistant'
import { useUiStore } from '@/store/ui'
import type { AssistantAction } from '@/types'
import { useCallback } from 'react'

/**
 * Asistan konuşmasının mantığı: soru gönder, yanıtı ekle ve (açıksa) sesli oku, öneriyi onayla.
 * Öneri yalnızca kullanıcı onaylarsa uygulanır (`PATCH /events/{id}/status`).
 */
export function useAssistantChat() {
  const query = useAssistantQuery()
  const updateStatus = useUpdateEventStatus()
  const { speak, stop } = useSpeech()
  const addMessage = useAssistantStore((s) => s.addMessage)
  const setProposalState = useAssistantStore((s) => s.setProposalState)

  /** Panel kapandıktan sonra okunmaz (okumayı durduracak kimse kalmaz). */
  const say = useCallback(
    (text: string) => {
      const { voiceEnabled } = useAssistantStore.getState()
      if (voiceEnabled && useUiStore.getState().assistantOpen) void speak(text)
    },
    [speak],
  )

  const reply = useCallback(
    (text: string, actions?: AssistantAction[]) => {
      addMessage('bot', text, actions)
      say(text)
    },
    [addMessage, say],
  )

  const { mutateAsync: askAsync, isPending } = query
  const ask = useCallback(
    (raw: string) => {
      const text = raw.trim()
      if (!text || isPending) return
      stop()
      addMessage('user', text)
      askAsync(text).then(
        (response) => reply(response.answer, response.actions),
        () => reply('Asistana ulaşılamadı. Biraz sonra tekrar deneyin.'),
      )
    },
    [addMessage, askAsync, isPending, reply, stop],
  )

  const { mutateAsync: updateAsync } = updateStatus
  const approve = useCallback(
    async (ref: ProposalRef, proposal: AssistantProposal) => {
      const action = assistantActions[proposal.type]
      const code = eventCode(proposal.event_id)
      setProposalState(ref, 'saving')
      try {
        await updateAsync({
          id: proposal.event_id,
          status: action.status,
          note: 'Sesli asistan önerisi onaylandı',
        })
        // Sonuç önerinin altında yazar; ayrıca balon eklenmez, yalnızca okunur.
        setProposalState(ref, 'done')
        say(`${code} ${action.done}.`)
      } catch (error) {
        const stale = isConflict(error)
        setProposalState(ref, stale ? 'stale' : 'failed')
        say(
          stale
            ? `${code} durumu bu arada değişmiş; öneri uygulanmadı.`
            : `${code} kaydedilemedi. Tekrar deneyin.`,
        )
      }
    },
    [say, setProposalState, updateAsync],
  )

  const dismiss = useCallback(
    (ref: ProposalRef) => setProposalState(ref, 'dismissed'),
    [setProposalState],
  )

  /** `stopSpeaking`: yalnızca asistanın kendi okumasını durdurur. */
  return { ask, pending: isPending, approve, dismiss, stopSpeaking: stop }
}
