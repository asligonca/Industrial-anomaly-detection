import { IconButton } from '@/components/ui/Button'
import { MicIcon } from '@/components/ui/icons'
import type { Ref } from 'react'
import { ASSISTANT_PANEL_ID } from './constants'

interface AssistantButtonProps {
  open: boolean
  onToggle: () => void
  ref?: Ref<HTMLButtonElement>
}

/** Sağ altta sabit sesli asistan düğmesi. Paneli açar / kapatır. */
export function AssistantButton({ open, onToggle, ref }: AssistantButtonProps) {
  return (
    <IconButton
      ref={ref}
      onClick={onToggle}
      label="Sesli asistan"
      aria-expanded={open}
      aria-controls={open ? ASSISTANT_PANEL_ID : undefined}
      variant="round"
      size="xl"
      className="fixed right-6 bottom-6 z-30 shadow-float"
    >
      <MicIcon size={22} />
    </IconButton>
  )
}
