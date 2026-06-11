import { useEffect, useRef, useState } from 'react'
import { X, Send, Sparkles, Bot } from 'lucide-react'
import { answer, suggestedPrompts, type CopilotMessage } from '../ai/copilot'
import { cls } from '../utils'

function renderMarkdown(text: string) {
  // minimal renderer: bold + line breaks + list dashes
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} className="font-semibold text-ink">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}

export function Copilot({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const send = (text: string) => {
    const q = text.trim()
    if (!q || thinking) return
    setMessages((m) => [...m, { role: 'user', content: q }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'assistant', content: answer(q) }])
      setThinking(false)
    }, 900)
  }

  return (
    <>
      {/* Scrim */}
      <div
        className={cls(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="AP Copilot"
        className={cls(
          'fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl transition-transform duration-250 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white">
              <Sparkles size={15} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">AP Copilot</h2>
              <p className="text-[11px] text-ink-faint">Grounded in your live AP subledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close copilot"
            className="cursor-pointer rounded-lg p-2 text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <div className="pt-6">
              <p className="text-center text-sm text-ink-soft">
                Ask anything about invoices, suppliers, cash or risk.
              </p>
              <div className="mt-4 space-y-2">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="block w-full cursor-pointer rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-left text-[13px] text-ink transition-colors hover:border-secondary/40 hover:bg-info-soft/40"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cls('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              {m.role === 'assistant' && (
                <span className="mt-1 mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-info-soft text-secondary">
                  <Bot size={13} aria-hidden="true" />
                </span>
              )}
              <div
                className={cls(
                  'max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line',
                  m.role === 'user' ? 'bg-primary text-white' : 'bg-canvas text-ink-soft',
                )}
              >
                {m.role === 'assistant' ? renderMarkdown(m.content) : m.content}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex items-center gap-2 pl-8 text-xs text-ink-faint" aria-live="polite">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:240ms]" />
              </span>
              Analyzing AP data…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="flex items-center gap-2 border-t border-line px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about invoices, cash, risk…"
            aria-label="Ask the AP copilot"
            className="flex-1 rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            aria-label="Send"
            className="cursor-pointer rounded-lg bg-primary p-2.5 text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={15} aria-hidden="true" />
          </button>
        </form>
      </aside>
    </>
  )
}
