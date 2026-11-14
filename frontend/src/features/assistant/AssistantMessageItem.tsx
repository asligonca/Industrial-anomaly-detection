import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { assistantActions } from '@/lib/eventRules'
import { eventCode } from '@/lib/labels'
import type { AssistantMessage, AssistantProposal } from '@/store/assistant'

interface AssistantMessageItemProps {
  message: AssistantMessage
  onApprove: (messageId: number, index: number, proposal: AssistantProposal) => void
  onDismiss: (messageId: number, index: number) => void
}

/** Konuşma balonu: asistan solda gri, kullanıcı sağda koyu. Öneri varsa altında onay düğmeleri. */
export function AssistantMessageItem({ message, onApprove, onDismiss }: AssistantMessageItemProps) {
  const fromUser = message.from === 'user'

  return (
    <li
      className={cn(
        'max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-normal',
        fromUser ? 'self-end bg-zinc-900 text-white' : 'self-start bg-zinc-100 text-zinc-900',
      )}
    >
      <span className="sr-only">{fromUser ? 'Siz: ' : 'Asistan: '}</span>
      {message.text}
      {message.proposals.map((proposal, index) => (
        <ProposalControls
          key={index}
          proposal={proposal}
          onApprove={() => onApprove(message.id, index, proposal)}
          onDismiss={() => onDismiss(message.id, index)}
        />
      ))}
    </li>
  )
}

interface ProposalControlsProps {
  proposal: AssistantProposal
  onApprove: () => void
  onDismiss: () => void
}

/** Öneri yalnızca onaylanınca uygulanır. Kayıt sürerken odak düğmede kalsın: `aria-disabled`. */
function ProposalControls({ proposal, onApprove, onDismiss }: ProposalControlsProps) {
  const action = assistantActions[proposal.type]
  const code = eventCode(proposal.event_id)

  if (proposal.state === 'done') {
    return <p className="mt-2 text-xs text-zinc-500">{`${code} ${action.done}.`}</p>
  }
  if (proposal.state === 'dismissed') {
    return <p className="mt-2 text-xs text-zinc-500">Öneri uygulanmadı.</p>
  }

  const saving = proposal.state === 'saving'
  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      <Button
        size="sm"
        aria-disabled={saving || undefined}
        onClick={() => {
          if (!saving) onApprove()
        }}
        aria-label={saving ? `${code}: kaydediliyor` : `${code}: ${action.label}`}
      >
        {saving ? 'Kaydediliyor…' : action.label}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        aria-disabled={saving || undefined}
        onClick={() => {
          if (!saving) onDismiss()
        }}
      >
        Vazgeç
      </Button>
    </div>
  )
}
