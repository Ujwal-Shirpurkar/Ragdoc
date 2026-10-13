import { FileText } from 'lucide-react'
import type { DocChunk, RetrievedChunk } from '../types'
import { Badge } from './Badge'

interface Props {
  chunk: DocChunk | RetrievedChunk
  selected?: boolean
  cited?: boolean
  onSelect?: () => void
}

const isRetrieved = (c: DocChunk | RetrievedChunk): c is RetrievedChunk => 'score' in c

export function ChunkCard({ chunk, selected, cited, onSelect }: Props) {
  const retrieved = isRetrieved(chunk) ? chunk : null
  return (
    <article
      id={`chunk-${chunk.id}`}
      className={`rise rounded-md border bg-ink-900 p-3 transition-colors ${selected ? 'border-accent ring-1 ring-accent/50' : 'border-line hover:border-line-strong'}`}
    >
      <button onClick={onSelect} disabled={!onSelect} className="block w-full text-left disabled:cursor-default" aria-pressed={selected}>
        <div className="flex flex-wrap items-center gap-2">
          {retrieved && <span className="flex size-5 items-center justify-center rounded bg-ink-700 text-[11px] font-semibold text-slate-200">#{retrieved.rank}</span>}
          <FileText className="size-3.5 text-slate-400" aria-hidden />
          <span className="font-mono text-xs text-slate-200">{chunk.source}</span>
          <span className="font-mono text-xs text-slate-400">chunk {chunk.index}</span>
          {cited && <Badge tone="green">used in answer</Badge>}
        </div>
        {retrieved && (
          <div className="mt-2.5 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700"
              role="meter"
              aria-label={`Cosine similarity ${retrieved.score.toFixed(3)} on a 0 to 1 scale`}
              aria-valuemin={0} aria-valuemax={1} aria-valuenow={retrieved.score}
            >
              <div className="grow h-full rounded-full bg-accent" style={{ width: `${Math.max(0, Math.min(1, retrieved.score)) * 100}%` }} />
            </div>
            <span className="font-mono text-xs tabular-nums text-slate-200" title="Cosine similarity: a relative ranking signal, not a probability">{retrieved.score.toFixed(3)}</span>
          </div>
        )}
        <p className="mt-2.5 text-[13px] leading-relaxed text-slate-300">{chunk.text}</p>
      </button>
    </article>
  )
}
