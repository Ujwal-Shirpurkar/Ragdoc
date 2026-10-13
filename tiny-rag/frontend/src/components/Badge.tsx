import type { ReactNode } from 'react'

const tones = {
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  blue: 'border-accent/30 bg-accent/10 text-accent-soft',
  slate: 'border-line-strong bg-ink-800 text-slate-300',
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  red: 'border-red-500/30 bg-red-500/10 text-red-700',
}

export function Badge({ tone = 'slate', children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none ${tones[tone]}`}>
      {children}
    </span>
  )
}
