import { useState, type KeyboardEvent, type RefObject } from 'react'
import { ArrowUp, Loader2 } from 'lucide-react'
import type { Mode } from '../types'

interface Props {
  disabled: boolean
  mode: Mode
  inputRef: RefObject<HTMLTextAreaElement | null>
  onSubmit: (text: string) => void
}

export function Composer({ disabled, mode, inputRef, onSubmit }: Props) {
  const [value, setValue] = useState('')

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSubmit(text)
    setValue('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter submits, Shift+Enter inserts a newline. Ignore Enter while an IME is composing.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="sticky bottom-0 border-t border-line bg-ink-950/95 p-3 backdrop-blur sm:p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-lg border border-line-strong bg-ink-900 p-2 focus-within:border-accent">
        <label htmlFor="question" className="sr-only">Ask a question about the Veloria documents</label>
        <textarea
          id="question" ref={inputRef} rows={1} value={value}
          onChange={(e) => setValue(e.target.value)} onKeyDown={onKeyDown}
          placeholder="Ask about the Veloria system…"
          className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] text-slate-100 placeholder:text-slate-500 focus-visible:outline-none [field-sizing:content]"
        />
        <button
          onClick={submit} disabled={disabled || !value.trim()} aria-label="Send question"
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-slate-500"
        >
          {disabled ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ArrowUp className="size-4" aria-hidden />}
        </button>
      </div>
      <p className="mx-auto mt-1.5 max-w-3xl px-1 text-[11px] text-slate-500">
        <kbd className="font-mono">Enter</kbd> to send, <kbd className="font-mono">Shift+Enter</kbd> for a new line, <kbd className="font-mono">/</kbd> to focus. {mode === 'demo' ? 'Demo mode: no model is called.' : 'Live mode: local Ollama.'}
      </p>
    </div>
  )
}
