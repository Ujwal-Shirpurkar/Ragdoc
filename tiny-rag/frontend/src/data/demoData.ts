// DEMO / MOCK DATA ONLY.
// Chunk text is copied from tiny-rag/documents/*.txt. Scores and answers come from
// the output of `python test_rag.py` (Mission 1). Nothing here is fetched live.
import type { AssistantMessage, DocChunk, PipelineStage, RetrievedChunk } from '../types'

export const DOCUMENTS: { filename: string; chunks: DocChunk[] }[] = [
  {
    filename: 'document_1.txt',
    chunks: [
      { id: 'document_1.txt#0', source: 'document_1.txt', index: 0, text: 'The Zorathian Sun is a yellow star at the center of the Veloria system. It is about 4.2 billion years old and burns steadily, with a surface temperature of roughly 5,900 degrees Celsius.' },
      { id: 'document_1.txt#1', source: 'document_1.txt', index: 1, text: 'Every 11 years the Zorathian Sun goes through a solar storm cycle called the Great Flare. During a Great Flare, auroras can be seen near the equator of the inner planets.' },
      { id: 'document_1.txt#2', source: 'document_1.txt', index: 2, text: "The Sun's light takes exactly 9 minutes to reach the planet Kelmora, which is the innermost planet." },
    ],
  },
  {
    filename: 'document_2.txt',
    chunks: [
      { id: 'document_2.txt#0', source: 'document_2.txt', index: 0, text: 'Kelmora is a small, rocky planet with no moons. Its surface is covered in black basalt, and daytime temperatures reach 410 degrees Celsius.' },
      { id: 'document_2.txt#1', source: 'document_2.txt', index: 1, text: 'Tessaly is the largest planet in the Veloria system. It is a gas giant with 14 moons and a pale green atmosphere made mostly of hydrogen and methane.' },
      { id: 'document_2.txt#2', source: 'document_2.txt', index: 2, text: "Tessaly's largest moon, Ombrin, has a frozen ocean beneath which scientists believe liquid water may exist." },
    ],
  },
  {
    filename: 'document_3.txt',
    chunks: [
      { id: 'document_3.txt#0', source: 'document_3.txt', index: 0, text: 'The Veloria Survey Probe was launched in the year 2031 and was the first spacecraft to visit Tessaly. It carried a camera, a magnetometer, and a dust detector.' },
      { id: 'document_3.txt#1', source: 'document_3.txt', index: 1, text: 'The probe reached Tessaly after a journey of 6 years. Its main discovery was that Tessaly has a faint ring system made of dark dust.' },
      { id: 'document_3.txt#2', source: 'document_3.txt', index: 2, text: "Mission control for the Veloria Survey Probe was located in the city of Port Almera, and the mission ended in 2041 when the probe's fuel ran out." },
    ],
  },
]

const CHUNK_BY_ID = new Map(DOCUMENTS.flatMap((d) => d.chunks).map((c) => [c.id, c]))

/** Build the top-3 list from [chunkId, score] pairs, already sorted best-first. */
function top3(pairs: [string, number][]): RetrievedChunk[] {
  return pairs.map(([id, score], i) => ({ ...CHUNK_BY_ID.get(id)!, score, rank: i + 1 }))
}

interface DemoEntry {
  question: string
  text: string
  outcome: AssistantMessage['outcome']
  evidence: RetrievedChunk[]
  citedChunkIds: string[]
  caveat?: string
}

const REAL_MODEL_CAVEAT =
  'In real runs, llama3.2 sometimes refused this question even though the right chunk was retrieved (see docs/2_problems.md). This simulated answer shows the intended behavior.'

const DEMO_ENTRIES: DemoEntry[] = [
  {
    question: 'How many moons does Tessaly have?',
    text: 'Tessaly has 14 moons. This comes from document_2.txt, chunk 1.',
    outcome: 'grounded',
    evidence: top3([['document_2.txt#1', 0.751], ['document_3.txt#1', 0.627], ['document_2.txt#2', 0.616]]),
    citedChunkIds: ['document_2.txt#1'],
  },
  {
    question: 'When was the Veloria Survey Probe launched?',
    text: 'The Veloria Survey Probe was launched in 2031, according to document_3.txt, chunk 0.',
    outcome: 'grounded',
    evidence: top3([['document_3.txt#0', 0.824], ['document_3.txt#2', 0.649], ['document_1.txt#0', 0.594]]),
    citedChunkIds: ['document_3.txt#0'],
    caveat: REAL_MODEL_CAVEAT,
  },
  {
    question: 'How long does sunlight take to reach Kelmora?',
    text: "Sunlight takes exactly 9 minutes to reach Kelmora, the innermost planet, according to document_1.txt, chunk 2.",
    outcome: 'grounded',
    evidence: top3([['document_1.txt#2', 0.721], ['document_2.txt#0', 0.645], ['document_1.txt#0', 0.556]]),
    citedChunkIds: ['document_1.txt#2'],
    caveat: REAL_MODEL_CAVEAT,
  },
  {
    question: 'Who won the 1998 FIFA World Cup?',
    text: 'The provided context does not contain enough information to answer this.',
    outcome: 'abstained',
    evidence: top3([['document_1.txt#0', 0.336], ['document_3.txt#1', 0.329], ['document_2.txt#1', 0.328]]),
    citedChunkIds: [],
    caveat:
      'Retrieval always returns the top 3 chunks, even when none are relevant. The scores here are low relative to the other examples, but a score is a ranking signal, not a probability.',
  },
]

export const SUGGESTED_QUESTIONS = DEMO_ENTRIES.map((e) => e.question)

const normalize = (q: string) => q.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

export function findDemoEntry(question: string): DemoEntry | undefined {
  const n = normalize(question)
  return DEMO_ENTRIES.find((e) => normalize(e.question) === n)
}

export const NO_DEMO_DATA_TEXT =
  'This demo only has simulated data for the four suggested questions. Nothing was retrieved or generated for this one. Live answers need the backend integration.'

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'chunks', title: 'Document chunks', description: 'Each document is split into paragraph-sized chunks that keep their source filename and index.', codeRef: 'rag.py: chunk_documents()' },
  { id: 'retrieval', title: 'Embedding and retrieval', description: 'The question and chunks become vectors (mxbai-embed-large). Chunks are ranked by cosine similarity and the top 3 are kept.', codeRef: 'rag.py: embed(), retrieve()' },
  { id: 'generation', title: 'Answer generation', description: 'The top chunks are pasted into a prompt with the question and sent to llama3.2.', codeRef: 'rag.py: generate_answer()' },
]

/** Static example list shown in the sidebar, labeled as examples (not real history). */
export const EXAMPLE_HISTORY = SUGGESTED_QUESTIONS.slice(0, 3)

export const MODELS = { embedding: 'mxbai-embed-large', generation: 'llama3.2' }

/** Simulated pipeline latency so loading states are visible. No network call is made. */
export function simulateResponse(question: string): Promise<AssistantMessage> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const entry = findDemoEntry(question)
      resolve({
        id: crypto.randomUUID(),
        role: 'assistant',
        simulated: true,
        status: 'done',
        question,
        text: entry?.text ?? NO_DEMO_DATA_TEXT,
        outcome: entry?.outcome ?? 'no-demo-data',
        evidence: entry?.evidence ?? [],
        citedChunkIds: entry?.citedChunkIds ?? [],
        caveat: entry?.caveat,
      })
    }, 1100)
  })
}
