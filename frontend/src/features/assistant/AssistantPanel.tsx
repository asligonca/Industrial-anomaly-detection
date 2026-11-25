import { IconButton } from '@/components/ui/Button'
import { CloseIcon, MicIcon } from '@/components/ui/icons'
import { chipClass } from '@/components/ui/chipStyles'
import { inputClass } from '@/components/ui/inputStyles'
import { stopSpeech } from '@/lib/speech/player'
import { voiceDownloadText } from '@/lib/speech/speechText'
import { useSpeechRecognition } from '@/lib/speech/useSpeechRecognition'
import { useAssistantStore } from '@/store/assistant'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AssistantMessageItem } from './AssistantMessageItem'
import { ASSISTANT_PANEL_ID, ASSISTANT_SUGGESTIONS } from './constants'
import { useAssistantChat } from './useAssistantChat'

/**
 * Sesli asistan paneli: sağ altta, düğmenin üstünde (dar ekranda tam genişlik). Açılınca odak
 * metin alanına gelir; × kapatır, Escape'i `AssistantDock` dinler (odağı düğmeye geri vermek
 * `onClose`'un işi).
 * Modal değil: arkadaki sayfa kullanılabilir kalır.
 */
export function AssistantPanel({ onClose }: { onClose: () => void }) {
  const messages = useAssistantStore((s) => s.messages)
  const voiceEnabled = useAssistantStore((s) => s.voiceEnabled)
  const setVoiceEnabled = useAssistantStore((s) => s.setVoiceEnabled)
  const { ask, pending, approve, dismiss, speech } = useAssistantChat()
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Yanıt beklenirken gelen sesli soru kaybolmasın: metin alanına yazılır, kullanıcı gönderir.
  const recognition = useSpeechRecognition((text) => (pending ? setDraft(text) : ask(text)))

  // Panel açılınca odak metin alanına.
  useEffect(() => inputRef.current?.focus(), [])

  // Sesli yanıt açıksa model şimdiden insin; ilk yanıt beklemesin.
  const { prepare } = speech
  useEffect(() => {
    if (voiceEnabled && speech.supported) void prepare()
  }, [voiceEnabled, speech.supported, prepare])

  // Yeni mesajda en alta kaydır.
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages.length, pending, recognition.listening])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pending) return
    ask(draft)
    setDraft('')
  }

  const toggleListening = () => {
    if (recognition.listening) {
      recognition.stop()
      return
    }
    if (pending) return
    // Mikrofon hiçbir okumayı duymasın: asistanınki de, sayfadaki sesli özet de durur.
    stopSpeech()
    recognition.start()
  }

  // Onay düğmeleri kalkınca odak `body`'ye düşer; kullanıcı başka yere geçmediyse metin alanına.
  const refocusInput = () => {
    if (!document.activeElement || document.activeElement === document.body) {
      inputRef.current?.focus()
    }
  }

  const toggleVoice = () => {
    if (voiceEnabled) speech.stop()
    setVoiceEnabled(!voiceEnabled)
  }

  const subtitle =
    speech.download !== null ? voiceDownloadText(speech.download) : 'Eller serbest · Türkçe'

  return (
    <section
      id={ASSISTANT_PANEL_ID}
      role="dialog"
      aria-labelledby="assistant-title"
      className="fixed inset-x-4 bottom-24 z-30 flex h-[520px] max-h-[calc(100dvh-120px)] flex-col overflow-hidden rounded-card border border-zinc-200 bg-white shadow-popover sm:inset-x-auto sm:right-6 sm:w-[380px]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-zinc-100 py-4 pr-3 pl-5">
        <div className="min-w-0">
          <h2 id="assistant-title" className="text-[15px] font-semibold">
            Sesli asistan
          </h2>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1">
          {speech.supported && (
            <IconButton
              onClick={toggleVoice}
              aria-pressed={voiceEnabled}
              label="Yanıtları sesli oku"
              title={voiceEnabled ? 'Sesli yanıt açık' : 'Sesli yanıt kapalı'}
            >
              <SpeakerIcon muted={!voiceEnabled} />
            </IconButton>
          )}
          <IconButton onClick={onClose} label="Asistanı kapat">
            <CloseIcon />
          </IconButton>
        </div>
      </header>

      {/* `role="log"` liste öğesine konamaz (liste anlamı kaybolur): saran kutuda. */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Konuşma"
        className="flex-1 overflow-y-auto p-5"
      >
        <ol className="flex flex-col gap-3">
          {messages.map((message) => (
            <AssistantMessageItem
              key={message.id}
              message={message}
              onApprove={(messageId, index, proposal) =>
                void approve(messageId, index, proposal).then(refocusInput)
              }
              onDismiss={(messageId, index) => {
                dismiss(messageId, index)
                inputRef.current?.focus()
              }}
            />
          ))}
          {pending && (
            <li className="self-start rounded-xl bg-zinc-100 px-3.5 py-2.5 text-sm text-zinc-500">
              Yanıtlanıyor…
            </li>
          )}
          {recognition.listening && (
            <li className="self-end text-[13px] text-danger">Dinleniyor…</li>
          )}
        </ol>
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-100 px-4 py-3">
        <div role="group" aria-label="Önerilen sorular" className="flex flex-wrap gap-2">
          {ASSISTANT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              aria-disabled={pending || undefined}
              onClick={() => ask(suggestion)}
              className={chipClass('sm')}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex gap-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Bir şey sorun"
            aria-label="Asistana sorun"
            enterKeyHint="send"
            autoComplete="off"
            className={inputClass('md', 'min-w-0 flex-1')}
          />
          {recognition.supported && (
            <IconButton
              onClick={toggleListening}
              // Yanıt beklenirken yeni soru sorulamaz; dinleme sürüyorsa durdurulabilir.
              aria-disabled={(pending && !recognition.listening) || undefined}
              aria-pressed={recognition.listening}
              label={recognition.listening ? 'Dinlemeyi durdur' : 'Sesle sor'}
              variant={recognition.listening ? 'alert' : 'outline'}
              size="md"
            >
              <MicIcon size={18} />
            </IconButton>
          )}
        </form>
        {recognition.error && (
          <p role="alert" className="text-[13px] text-danger">
            {recognition.error}
          </p>
        )}
      </div>
    </section>
  )
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 5 6 9H3v6h3l5 4z" />
      {muted ? (
        <path d="m16 9 5 6M21 9l-5 6" />
      ) : (
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      )}
    </svg>
  )
}
