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
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      aria-label="Sesli asistan"
      aria-expanded={open}
      aria-controls={open ? ASSISTANT_PANEL_ID : undefined}
      className="fixed right-6 bottom-6 z-30 grid size-14 place-items-center rounded-full bg-zinc-900 shadow-float hover:bg-zinc-700"
    >
      <MicIcon size={22} className="stroke-white" />
    </button>
  )
}

export function MicIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  )
}
