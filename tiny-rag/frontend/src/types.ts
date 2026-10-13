/** A paragraph-sized piece of a source document (mirrors chunk_documents in rag.py). */
export interface DocChunk {
  id: string
  source: string
  index: number
  text: string
}

/** A chunk returned by retrieval, with its cosine-similarity score and rank (1 = best). */
export interface RetrievedChunk extends DocChunk {
  score: number
  rank: number
}

// 'answered' is a live response (the backend can't classify it further); the rest are demo-only.
export type AnswerOutcome = 'answered' | 'grounded' | 'abstained' | 'no-demo-data' | 'error'

export interface UserMessage {
  id: string
  role: 'user'
  text: string
}

export interface AssistantMessage {
  id: string
  role: 'assistant'
  /** True for demo data. False means the backend and Ollama produced this response. */
  simulated: boolean
  status: 'done' | 'error'
  text: string
  outcome: AnswerOutcome
  evidence: RetrievedChunk[]
  /** Chunk ids the answer relies on. Always empty for live responses: the backend can't tell which chunks were used. */
  citedChunkIds: string[]
  /** Extra honesty note shown under the answer. */
  caveat?: string
  /** The question, kept so an errored response can be retried. */
  question: string
}

export type Message = UserMessage | AssistantMessage

export type StageId = 'chunks' | 'retrieval' | 'generation'

export interface PipelineStage {
  id: StageId
  title: string
  description: string
  /** Where in rag.py this stage lives. */
  codeRef: string
}

/** Shape of GET /api/health. */
export interface Health {
  api: 'ok'
  ollama: {
    reachable: boolean
    models: Record<'embedding' | 'generation', { name: string; installed: boolean | null }>
  }
}

export type BackendStatus = { kind: 'checking' } | { kind: 'offline' } | { kind: 'ok'; health: Health }

export type Mode = 'live' | 'demo'

export interface DocumentInfo {
  filename: string
  chunks: DocChunk[]
}
