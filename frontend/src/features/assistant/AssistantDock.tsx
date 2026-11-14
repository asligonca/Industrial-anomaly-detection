import { useUiStore } from '@/store/ui'
import { useCallback, useRef } from 'react'
import { AssistantButton } from './AssistantButton'
import { AssistantPanel } from './AssistantPanel'

/**
 * Asistan düğmesi ve paneli. Panel kapanınca odak düğmeye elle verilir: panel içeriği kalkınca
 * odak `body`'ye düşer, tarayıcı geri vermez (FE-9 `Dialog` dersi).
 */
export function AssistantDock() {
  const open = useUiStore((s) => s.assistantOpen)
  const toggle = useUiStore((s) => s.toggleAssistant)
  const close = useUiStore((s) => s.closeAssistant)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const closePanel = useCallback(() => {
    close()
    buttonRef.current?.focus()
  }, [close])

  return (
    <>
      <AssistantButton ref={buttonRef} open={open} onToggle={toggle} />
      {open && <AssistantPanel onClose={closePanel} />}
    </>
  )
}
