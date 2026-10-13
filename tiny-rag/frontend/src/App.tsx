import { useCallback, useEffect, useRef, useState } from 'react'
import { Menu, RotateCcw } from 'lucide-react'
import { ApiError, describeStatus, fetchDocuments, fetchStatus, postQuery } from './api'
import { DOCUMENTS, simulateResponse } from './data/demoData'
import type { AssistantMessage, BackendStatus, DocumentInfo, Message, Mode } from './types'
import { Badge } from './components/Badge'
import { ChatPanel } from './components/ChatPanel'
import { EvidenceInspector, type InspectorTab } from './components/EvidenceInspector'
import { Sidebar } from './components/Sidebar'

export default function App() {
  const [mode, setMode] = useState<Mode>('live')
  const [status, setStatus] = useState<BackendStatus>({ kind: 'checking' })
  const [fetchedDocs, setFetchedDocs] = useState<DocumentInfo[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [tab, setTab] = useState<InspectorTab>('evidence')
  const [chunkId, setChunkId] = useState<string | null>(null)
  const [focusDoc, setFocusDoc] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Bumped on reset so a response that was in flight is discarded.
  const generation = useRef(0)

  // Live mode: poll /api/health. Demo mode never contacts the backend.
  const refreshStatus = useCallback(() => { fetchStatus().then(setStatus) }, [])
  useEffect(() => {
    if (mode !== 'live') return
    refreshStatus()
    const t = setInterval(refreshStatus, 10_000)
    return () => clearInterval(t)
  }, [mode, refreshStatus])

  // Documents: sample copies in demo mode, the backend's real list in live mode (empty until it answers).
  const backendUp = status.kind === 'ok'
  useEffect(() => {
    if (mode !== 'live' || !backendUp) return
    fetchDocuments().then(setFetchedDocs).catch(() => setFetchedDocs([]))
  }, [mode, backendUp])
  const documents = mode === 'demo' ? DOCUMENTS : backendUp ? fetchedDocs : []

  /** retryOf: id of a failed assistant message to replace (the user's question is kept, not duplicated). */
  const ask = useCallback(async (question: string, retryOf?: string) => {
    const gen = generation.current
    setMessages((m) => retryOf
      ? m.filter((x) => x.id !== retryOf)
      : [...m, { id: crypto.randomUUID(), role: 'user', text: question }])
    setLoading(true)
    setTab('evidence')
    setChunkId(null)
    let reply: AssistantMessage
    try {
      reply = mode === 'live' ? await postQuery(question) : await simulateResponse(question)
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError('unknown', 'Something went wrong.')
      reply = {
        id: crypto.randomUUID(), role: 'assistant', simulated: mode === 'demo', status: 'error', question,
        text: err.message, outcome: 'error', evidence: err.evidence, citedChunkIds: [],
      }
      if (mode === 'live') refreshStatus()
    }
    if (gen !== generation.current) return
    setMessages((m) => [...m, reply])
    setActiveId(reply.id)
    setLoading(false)
  }, [mode, refreshStatus])

  const clear = () => {
    generation.current++
    setMessages([]); setLoading(false); setActiveId(null); setChunkId(null); setFocusDoc(null); setTab('evidence')
  }
  const reset = () => { clear(); inputRef.current?.focus() }
  const switchMode = (m: Mode) => { if (m !== mode) { clear(); setMode(m); setStatus({ kind: 'checking' }) } }

  const inspect = (m: AssistantMessage, id?: string) => {
    setActiveId(m.id); setTab('evidence'); setChunkId(id ?? null)
    if (id) requestAnimationFrame(() => document.getElementById(`chunk-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }

  const openDocument = (filename: string) => {
    setFocusDoc(filename); setTab('corpus')
    // The corpus list is taller than the panel (and sits below the chat on mobile), so bring the document into view.
    requestAnimationFrame(() => document.querySelector(`section[aria-label="${filename}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
  }

  // "/" focuses the question box; Escape closes the mobile sidebar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName)
      if (e.key === '/' && !typing) { e.preventDefault(); inputRef.current?.focus() }
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const active = messages.find((m): m is AssistantMessage => m.role === 'assistant' && m.id === activeId) ?? null
  const st = describeStatus(status)

  return (
    <div className="flex h-dvh bg-ink-950">
      <Sidebar
        open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewConversation={reset} onAsk={ask} onOpenDocument={openDocument}
        mode={mode} status={status} documents={documents}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-ink-950/95 px-4 backdrop-blur">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar" className="rounded p-1.5 text-slate-300 hover:bg-ink-700 lg:hidden">
            <Menu className="size-5" />
          </button>
          <h1 className="text-sm font-semibold"><span className="neon-title">Tiny RAG</span> <span className="label-cyan hidden font-medium sm:inline">/ Veloria documents</span></h1>

          <div role="group" aria-label="Data source" className="flex rounded-md border border-line-strong p-0.5 text-xs">
            {(['live', 'demo'] as const).map((m) => (
              <button key={m} onClick={() => switchMode(m)} aria-pressed={mode === m}
                className={`rounded px-2.5 py-1 font-medium capitalize ${mode === m ? 'bg-accent text-white' : 'text-slate-400 hover:text-slate-100'}`}>
                {m}
              </button>
            ))}
          </div>
          {mode === 'demo' ? <Badge tone="amber">Simulated, no backend</Badge> : <Badge tone={st.tone}>{st.label}</Badge>}

          <button onClick={reset} className="ml-auto inline-flex items-center gap-1.5 rounded border border-line-strong px-2.5 py-1.5 text-xs text-slate-200 hover:border-accent">
            <RotateCcw className="size-3.5" aria-hidden /> <span className="hidden sm:inline">Reset</span>
          </button>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_400px]">
          <ChatPanel messages={messages} loading={loading} mode={mode} activeMessageId={activeId} inputRef={inputRef} onAsk={ask} onInspect={inspect} />
          <EvidenceInspector
            message={active} mode={mode} documents={documents} tab={tab} onTab={setTab}
            selectedChunkId={chunkId} onSelectChunk={setChunkId} focusDoc={focusDoc}
          />
        </main>
      </div>
    </div>
  )
}
