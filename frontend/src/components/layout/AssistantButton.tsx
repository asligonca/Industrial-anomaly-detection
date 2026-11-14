import { useUiStore } from '@/store/ui'

/** Sağ altta sabit sesli asistan düğmesi. Paneli FE-10 `assistantOpen` bayrağına bağlayacak. */
export function AssistantButton() {
  const open = useUiStore((s) => s.assistantOpen)
  const toggle = useUiStore((s) => s.toggleAssistant)

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Sesli asistan"
      aria-pressed={open}
      className="fixed right-6 bottom-6 z-30 grid size-14 place-items-center rounded-full bg-zinc-900 shadow-float hover:bg-zinc-700"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-white"
        aria-hidden
      >
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    </button>
  )
}
