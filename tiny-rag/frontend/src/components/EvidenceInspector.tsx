import { useState } from 'react'
import { Info, ScanSearch } from 'lucide-react'
import type { AssistantMessage, DocumentInfo, Mode } from '../types'
import { Badge } from './Badge'
import { ChunkCard } from './ChunkCard'
import { PipelineStrip } from './PipelineStrip'

export type InspectorTab = 'evidence' | 'corpus'

interface Props {
  message: AssistantMessage | null
  mode: Mode
  documents: DocumentInfo[]
  tab: InspectorTab
  onTab: (t: InspectorTab) => void
  selectedChunkId: string | null
  onSelectChunk: (id: string | null) => void
  focusDoc: string | null
}

export function EvidenceInspector({ message, mode, documents, tab, onTab, selectedChunkId, onSelectChunk, focusDoc }: Props) {
  const [showPipeline, setShowPipeline] = useState(true)
  const retrievedIds = new Set(message?.evidence.map((e) => e.id))

  return (
    <aside aria-label="Evidence inspector" className="flex flex-col border-t border-line bg-ink-900 lg:min-h-0 lg:border-l lg:border-t-0">
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-line px-3" role="tablist">
        {(['evidence', 'corpus'] as const).map((t) => (
          <button
            key={t} role="tab" aria-selected={tab === t} onClick={() => onTab(t)}
            className={`rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-ink-700 text-slate-100' : 'text-slate-400 hover:text-slate-100'}`}
          >
            {t === 'evidence' ? 'Evidence' : 'All chunks'}
          </button>
        ))}
        {mode === 'demo' ? <Badge tone="amber">sample data</Badge> : <Badge tone="green">live data</Badge>}
      </div>

      <div className="flex-1 space-y-5 p-4 lg:overflow-y-auto">
        {tab === 'evidence' ? (
          message && (message.status === 'done' || message.evidence.length > 0) ? (
            <>
              <div>
                <p className="label-cyan text-[11px] font-semibold uppercase tracking-wider">Question</p>
                <p className="mt-1 text-sm text-slate-100">{message.question}</p>
              </div>

              {message.evidence.length > 0 ? (
                <div className="space-y-2">
                  <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-400">
                    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    Top 3 chunks by cosine similarity. Scores rank chunks against each other; they are not probabilities or confidence.
                  </p>
                  {message.evidence.map((c) => (
                    <ChunkCard
                      key={c.id} chunk={c}
                      cited={message.citedChunkIds.includes(c.id)}
                      selected={selectedChunkId === c.id}
                      onSelect={() => onSelectChunk(selectedChunkId === c.id ? null : c.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-line-strong p-4 text-sm text-slate-400">No sample retrieval exists for this question, so there is no evidence to show.</p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-line-strong px-4 py-10 text-center">
              <ScanSearch className="size-6 text-slate-500" aria-hidden />
              <p className="text-sm font-medium text-slate-200">No evidence yet</p>
              <p className="max-w-[28ch] text-xs leading-relaxed text-slate-400">Ask a question, and the chunks behind the answer will appear here.</p>
            </div>
          )
        ) : (
          <div className="space-y-5">
            <p className="text-xs leading-relaxed text-slate-400">All {documents.reduce((n, d) => n + d.chunks.length, 0)} chunks in the corpus. Chunks retrieved for the selected answer are marked.</p>
            {documents.length === 0 && <p className="text-sm text-slate-400">No documents loaded.</p>}
            {documents.map((d) => (
              <section key={d.filename} aria-label={d.filename} className={`scroll-mt-16 space-y-2 rounded-md lg:scroll-mt-2 ${focusDoc === d.filename ? 'ring-1 ring-accent/60 ring-offset-4 ring-offset-ink-900' : ''}`}>
                <h4 className="font-mono text-xs font-medium text-slate-200">{d.filename}</h4>
                {d.chunks.map((c) => (
                  <ChunkCard key={c.id} chunk={c} selected={retrievedIds.has(c.id)} />
                ))}
              </section>
            ))}
          </div>
        )}

        <div>
          <button onClick={() => setShowPipeline((v) => !v)} className="mb-2 text-xs text-accent-soft hover:underline" aria-expanded={showPipeline}>
            {showPipeline ? 'Hide pipeline' : 'Show pipeline'}
          </button>
          {showPipeline && <PipelineStrip />}
        </div>
      </div>
    </aside>
  )
}
