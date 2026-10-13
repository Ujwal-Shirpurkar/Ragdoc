import { AlertCircle, Ban, CircleCheck, FlaskConical, RotateCw, User } from 'lucide-react'
import type { AssistantMessage, Message } from '../types'
import { Badge } from './Badge'

interface Props {
  message: Message
  active: boolean
  onInspect: (m: AssistantMessage, chunkId?: string) => void
  onRetry: (failed: AssistantMessage) => void
}

export function MessageView({ message, active, onInspect, onRetry }: Props) {
  if (message.role === 'user') {
    return (
      <div className="rise flex gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink-700 text-slate-300"><User className="size-4" aria-hidden /></div>
        <div className="min-w-0 pt-0.5">
          <p className="text-xs font-medium text-slate-400">You</p>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] text-slate-100">{message.text}</p>
        </div>
      </div>
    )
  }

  const m = message
  const icon =
    m.status === 'error' ? <AlertCircle className="size-4" /> :
    m.outcome === 'grounded' ? <CircleCheck className="size-4" /> :
    m.outcome === 'abstained' ? <Ban className="size-4" /> : <FlaskConical className="size-4" />

  return (
    <div className="rise flex gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-soft" aria-hidden>{icon}</div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium text-slate-400">Assistant</p>
          {m.status === 'error' ? <Badge tone="red">Request failed</Badge> : m.simulated ? <Badge tone="amber">Simulated</Badge> : <Badge tone="green">Live · local Ollama</Badge>}
          {m.outcome === 'abstained' && <Badge tone="blue">Abstained: context insufficient</Badge>}
        </div>

        <div className={`mt-1.5 rounded-md border p-3.5 transition-colors ${active ? 'border-accent/60 bg-ink-800' : 'border-line bg-ink-900'} ${m.status === 'error' ? 'border-red-500/40' : ''}`}>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-100">{m.text}</p>

          {m.caveat && <p className="mt-3 border-t border-line pt-2.5 text-xs leading-relaxed text-slate-400">{m.caveat}</p>}

          {m.status === 'error' && (
            <button onClick={() => onRetry(m)} className="mt-3 inline-flex items-center gap-1.5 rounded border border-line-strong px-2.5 py-1 text-xs text-slate-200 hover:border-accent">
              <RotateCw className="size-3" aria-hidden /> Retry
            </button>
          )}

          {m.evidence.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5">
              <span className="text-xs text-slate-400">{m.citedChunkIds.length ? 'Grounded in:' : m.simulated ? 'Retrieved (none used):' : 'Retrieved:'}</span>
              {(m.citedChunkIds.length ? m.evidence.filter((e) => m.citedChunkIds.includes(e.id)) : m.evidence).map((e) => (
                <button
                  key={e.id} onClick={() => onInspect(m, e.id)}
                  className="rounded border border-line-strong bg-ink-700 px-2 py-0.5 font-mono text-[11px] text-accent-soft hover:border-accent"
                  title="Show this chunk in the evidence inspector"
                >
                  {e.source} #{e.index}
                </button>
              ))}
              <button onClick={() => onInspect(m)} className="ml-auto text-xs text-accent-soft hover:underline">Inspect evidence</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
