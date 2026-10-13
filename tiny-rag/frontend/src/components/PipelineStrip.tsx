import { ChevronRight } from 'lucide-react'
import { PIPELINE_STAGES } from '../data/demoData'
import { Badge } from './Badge'

/** Conceptual map of the pipeline. Describes what rag.py does; it does not report that a request ran. */
export function PipelineStrip() {
  return (
    <section aria-labelledby="pipe">
      <div className="mb-2 flex items-center gap-2">
        <h3 id="pipe" className="label-violet text-[11px] font-semibold uppercase tracking-wider">Pipeline</h3>
        <Badge tone="amber">conceptual, not executed</Badge>
      </div>
      <ol className="space-y-1.5">
        {PIPELINE_STAGES.map((s, i) => (
          <li key={s.id} className="rounded-md border border-line bg-ink-900 p-3">
            <div className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ink-700 text-[11px] font-semibold text-accent-soft">{i + 1}</span>
              <span className="text-sm font-medium text-slate-100">{s.title}</span>
              {i < PIPELINE_STAGES.length - 1 && <ChevronRight className="ml-auto size-3.5 text-slate-600" aria-hidden />}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{s.description}</p>
            <code className="mt-1.5 inline-block font-mono text-[11px] text-slate-500">{s.codeRef}</code>
          </li>
        ))}
      </ol>
    </section>
  )
}
