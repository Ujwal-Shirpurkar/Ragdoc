// Client for the FastAPI backend (tiny-rag/api.py). Contract: see the backend's api.py.
import type { AssistantMessage, BackendStatus, DocumentInfo, Health, RetrievedChunk } from './types'

export const API_BASE: string = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

/** Error with a machine-readable code and, for generation failures, the real retrieved evidence. */
export class ApiError extends Error {
  code: string
  evidence: RetrievedChunk[]
  constructor(code: string, message: string, evidence: RetrievedChunk[] = []) {
    super(message)
    this.code = code
    this.evidence = evidence
  }
}

async function request(path: string, init: RequestInit = {}, timeoutMs = 5000): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  let res: Response
  try {
    res = await fetch(API_BASE + path, { ...init, signal: ctrl.signal })
  } catch {
    throw new ApiError('backend_unreachable', `Cannot reach the backend at ${API_BASE}. Start it with: uvicorn api:app --port 8000`)
  } finally {
    clearTimeout(timer)
  }
  const body = await res.json().catch(() => null)
  if (res.ok) return body
  const detail = body?.detail
  if (Array.isArray(detail)) throw new ApiError('invalid_request', 'The backend rejected the question as invalid.')
  throw new ApiError(detail?.code ?? 'http_error', detail?.message ?? `Backend returned HTTP ${res.status}.`, detail?.retrieved ?? [])
}

export const fetchHealth = () => request('/api/health', {}, 3000) as Promise<Health>

export async function fetchDocuments(): Promise<DocumentInfo[]> {
  return ((await request('/api/documents')) as { documents: DocumentInfo[] }).documents
}

export async function fetchStatus(): Promise<BackendStatus> {
  try {
    return { kind: 'ok', health: await fetchHealth() }
  } catch {
    return { kind: 'offline' }
  }
}

/** Real retrieval + generation. Evidence order and scores are exactly what the backend returned. */
export async function postQuery(question: string): Promise<AssistantMessage> {
  const r = (await request(
    '/api/query',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) },
    180_000, // the first query also embeds the corpus, and local generation can be slow
  )) as { question: string; answer: string; retrieved: RetrievedChunk[] }
  return {
    id: crypto.randomUUID(), role: 'assistant', simulated: false, status: 'done',
    question: r.question, text: r.answer, outcome: 'answered', evidence: r.retrieved, citedChunkIds: [],
  }
}

/** Short label for a status, shared by the header and sidebar. */
export function describeStatus(s: BackendStatus): { tone: 'slate' | 'red' | 'amber' | 'green'; label: string; detail: string } {
  if (s.kind === 'checking') return { tone: 'slate', label: 'Checking…', detail: 'Contacting the backend.' }
  if (s.kind === 'offline') return { tone: 'red', label: 'Backend offline', detail: `No response from ${API_BASE}.` }
  const { ollama } = s.health
  if (!ollama.reachable) return { tone: 'amber', label: 'Ollama unreachable', detail: 'The API is up, but it cannot reach Ollama.' }
  const missing = Object.values(ollama.models).filter((m) => m.installed === false).map((m) => m.name)
  if (missing.length) return { tone: 'amber', label: 'Model missing', detail: `Not installed in Ollama: ${missing.join(', ')}.` }
  return { tone: 'green', label: 'Connected', detail: 'Verified through /api/health. Queries run locally.' }
}
