import { useEffect, useRef, type RefObject } from 'react'
import { Loader2, Telescope } from 'lucide-react'
import { SUGGESTED_QUESTIONS } from '../data/demoData'
import type { AssistantMessage, Message, Mode } from '../types'
import { Composer } from './Composer'
import { MessageView } from './MessageView'

interface Props {
  messages: Message[]
  loading: boolean
  mode: Mode
  activeMessageId: string | null
  inputRef: RefObject<HTMLTextAreaElement | null>
  onAsk: (q: string, retryOf?: string) => void
  onInspect: (m: AssistantMessage, chunkId?: string) => void
}

export function ChatPanel({ messages, loading, mode, activeMessageId, inputRef, onAsk, onInspect }: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }) }, [messages.length, loading])

  return (
    <section aria-label="Conversation" className="flex min-h-[calc(100dvh-3.5rem)] min-w-0 flex-col lg:min-h-0 lg:overflow-y-auto">
      <div className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
            <div className="rise pt-6 sm:pt-14">
              <Telescope className="size-8 text-accent-soft" aria-hidden />
              <h2 className="mt-4 neon-title text-2xl font-bold tracking-tight">Ask about the Veloria system</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                Three short, fictional documents describe a made-up solar system. Ask a question and inspect which chunks were retrieved, how they scored, and which ones the answer used.
              </p>
              {mode === 'demo' ? (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-amber-300/90">
                  Demo mode. Answers are simulated from saved results of the Python prototype's tests, and no model is called.
                </p>
              ) : (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                  Live mode. Questions go to your local backend, which retrieves chunks and generates the answer with Ollama.
                </p>
              )}
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <li key={q}>
                    <button onClick={() => onAsk(q)} className="h-full w-full rounded-md border border-line bg-ink-900 px-3.5 py-3 text-left text-sm text-slate-200 transition-colors hover:border-accent hover:bg-ink-800">
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            messages.map((m) => (
              <MessageView key={m.id} message={m} active={m.id === activeMessageId} onInspect={onInspect} onRetry={(failed) => onAsk(failed.question, failed.id)} />
            ))
          )}

          {loading && (
            <div role="status" className="flex items-center gap-3 text-sm text-slate-400">
              <Loader2 className="size-4 animate-spin text-accent-soft" aria-hidden /> {mode === 'demo' ? 'Simulating a response (no model call)…' : 'Retrieving chunks and generating an answer locally…'}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
      <Composer disabled={loading} mode={mode} inputRef={inputRef} onSubmit={(q) => onAsk(q)} />
    </section>
  )
}
