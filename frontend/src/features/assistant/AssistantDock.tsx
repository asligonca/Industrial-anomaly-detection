import { useUiStore } from '@/store/ui'
import { useCallback, useEffect, useRef } from 'react'
import { AssistantButton } from './AssistantButton'
import { AssistantPanel } from './AssistantPanel'

/**
 * Escape'i önce alması gereken açık pencere ya da menü. `:popover-open` desteklemeyen tarayıcıda
 * (Firefox < 125, Safari < 17) seçici SyntaxError atar; o tarayıcılarda yalnızca `<dialog>`a bakılır.
 */
const OVERLAY_SELECTOR =
  typeof CSS !== 'undefined' && CSS.supports('selector(:popover-open)')
    ? 'dialog[open], :popover-open'
    : 'dialog[open]'

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
      if (document.querySelector(OVERLAY_SELECTOR)) return
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
