import { Database, FileText, MessageSquarePlus, PanelLeftClose, Search, TriangleAlert } from 'lucide-react'
import { describeStatus } from '../api'
import { EXAMPLE_HISTORY, MODELS } from '../data/demoData'
import type { BackendStatus, DocumentInfo, Mode } from '../types'
import { Badge } from './Badge'

interface Props {
  open: boolean
  onClose: () => void
  onNewConversation: () => void
  onAsk: (q: string) => void
  onOpenDocument: (filename: string) => void
  mode: Mode
  status: BackendStatus
  documents: DocumentInfo[]
}

export function Sidebar({ open, onClose, onNewConversation, onAsk, onOpenDocument, mode, status, documents }: Props) {
  const st = describeStatus(status)
  const models = status.kind === 'ok' ? status.health.ollama.models : null
  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-ink-900 transition-transform duration-200 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-accent text-white">
              <Search className="size-4" aria-hidden />
            </div>
            <span className="neon-title text-[15px] font-bold tracking-tight">RAG Explorer</span>
          </div>
          <button onClick={onClose} aria-label="Close sidebar" className="rounded p-1.5 text-slate-400 hover:bg-ink-700 hover:text-slate-100 lg:hidden">
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <button
            onClick={() => { onNewConversation(); onClose() }}
            className="flex w-full items-center gap-2 rounded-md border border-line-strong bg-ink-800 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:border-accent hover:bg-ink-700"
          >
            <MessageSquarePlus className="size-4 text-accent-soft" aria-hidden /> New conversation
          </button>

          <section aria-labelledby="hist">
            <h2 id="hist" className="mb-2 flex items-center gap-2 label-pink text-[11px] font-semibold uppercase tracking-wider">
              Examples
            </h2>
            <ul className="space-y-0.5">
              {EXAMPLE_HISTORY.map((q) => (
                <li key={q}>
                  <button onClick={() => { onAsk(q); onClose() }} className="w-full truncate rounded px-2 py-1.5 text-left text-sm text-slate-300 hover:bg-ink-800 hover:text-slate-100" title={q}>
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="docs">
            <h2 id="docs" className="mb-2 label-green text-[11px] font-semibold uppercase tracking-wider">Documents</h2>
            <ul className="space-y-0.5">
              {documents.length === 0 && (
                <li className="px-2 py-1.5 text-xs text-slate-400">{mode === 'live' ? 'Unavailable until the backend is reachable.' : 'No documents.'}</li>
              )}
              {documents.map((d) => (
                <li key={d.filename}>
                  <button onClick={() => { onOpenDocument(d.filename); onClose() }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-slate-300 hover:bg-ink-800 hover:text-slate-100">
                    <FileText className="size-4 shrink-0 text-slate-400" aria-hidden />
                    <span className="flex-1 truncate font-mono text-[13px]">{d.filename}</span>
                    <span className="text-xs text-slate-400">{d.chunks.length} chunks</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="shrink-0 border-t border-line p-4">
          <div className="rounded-md border border-line bg-ink-800 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-200"><Database className="size-3.5" aria-hidden /> Local models</span>
              {mode === 'demo'
                ? <Badge tone="amber"><TriangleAlert className="size-3" aria-hidden /> Not connected</Badge>
                : <Badge tone={st.tone}>{st.label}</Badge>}
            </div>
            <dl className="space-y-1 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between"><dt>embed</dt><dd className="text-slate-300">{models?.embedding.name ?? MODELS.embedding}</dd></div>
              <div className="flex justify-between"><dt>generate</dt><dd className="text-slate-300">{models?.generation.name ?? MODELS.generation}</dd></div>
            </dl>
            <p className="mt-2 text-[11px] leading-snug text-slate-400">{mode === 'demo' ? 'Demo mode. Ollama has not been contacted, so availability is unverified.' : st.detail}</p>
          </div>
        </div>
      </aside>
    </>
  )
}
