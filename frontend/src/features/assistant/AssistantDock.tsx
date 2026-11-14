import { useUiStore } from '@/store/ui'
import { useCallback, useEffect, useRef } from 'react'
import { AssistantButton } from './AssistantButton'
import { AssistantPanel } from './AssistantPanel'

/**
 * Asistan düğmesi ve paneli. Panel kapanınca odak düğmeye elle verilir: panel içeriği kalkınca
 * odak `body`'ye düşer, tarayıcı geri vermez (FE-9 `Dialog` dersi).
 * Escape panel açıkken sayfanın her yerinde paneli kapatır; ama önce açık pencere (`<dialog>`) ya
 * da menü (popover) varsa Escape onlarındır, panel kapanmaz.
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

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      if (document.querySelector('dialog[open], :popover-open')) return
      closePanel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, closePanel])

  return (
    <>
      <AssistantButton ref={buttonRef} open={open} onToggle={toggle} />
      {open && <AssistantPanel onClose={closePanel} />}
    </>
  )
}
