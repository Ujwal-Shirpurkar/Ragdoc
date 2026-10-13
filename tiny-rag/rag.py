"""Tiny RAG: load docs -> chunk -> embed -> retrieve (cosine) -> generate."""
import sys
from pathlib import Path

import numpy as np
import ollama

EMBED_MODEL = "mxbai-embed-large"
LLM_MODEL = "llama3.2"
DOCS_DIR = Path(__file__).parent / "documents"
TOP_K = 3


def load_documents(docs_dir=DOCS_DIR):
    """Return {filename: text} for every .txt file in the directory."""
    return {p.name: p.read_text(encoding="utf-8") for p in sorted(docs_dir.glob("*.txt"))}


def chunk_documents(docs):
    """Chunking strategy: one chunk per paragraph (blank-line separated).

    Each chunk remembers which file it came from and its position in that file.
    """
    chunks = []
    for source, text in docs.items():
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        for i, para in enumerate(paragraphs):
            chunks.append({"source": source, "index": i, "text": para})
    return chunks


def embed(texts):
    """Turn texts into vectors.

    An embedding is a list of numbers that captures the *meaning* of a text.
    Texts with similar meaning get vectors that point in similar directions,
    which lets us search by meaning instead of by exact keywords.
    """
    response = ollama.embed(model=EMBED_MODEL, input=texts)
    return np.array(response["embeddings"], dtype=np.float64)


def normalize(vectors):
    """Scale each row to length 1. Zero-length rows stay all zeros (no divide-by-zero)."""
    norms = np.linalg.norm(vectors, axis=-1, keepdims=True)
    safe = np.where(norms == 0, 1.0, norms)
    return vectors / safe


def retrieve(question, chunks, chunk_vectors, top_k=TOP_K):
    """Rank chunks by cosine similarity to the question; return top_k (chunk, score)."""
    q = normalize(embed([question]))[0]
    # With unit-length vectors, the dot product IS the cosine similarity.
    scores = normalize(chunk_vectors) @ q
    order = np.argsort(scores)[::-1][:top_k]
    return [(chunks[i], float(scores[i])) for i in order]


def generate_answer(question, retrieved):
    context = "\n\n".join(f"[{c['source']}, chunk {c['index']}]\n{c['text']}" for c, _ in retrieved)
    prompt = (
        "Answer the question using ONLY the context below.\n"
        "- If the context does not contain the answer, say exactly that: "
        "\"The provided context does not contain enough information to answer this.\"\n"
        "- Do not use outside knowledge and do not invent facts.\n"
        "- Say which facts come from the context, and say so plainly if you are unsure.\n\n"
        f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
    )
    response = ollama.chat(model=LLM_MODEL, messages=[{"role": "user", "content": prompt}])
    return response["message"]["content"]


def build_index():
    chunks = chunk_documents(load_documents())
    vectors = embed([c["text"] for c in chunks])
    return chunks, vectors


def ask(question, chunks, vectors):
    retrieved = retrieve(question, chunks, vectors)
    print(f"\nQUESTION: {question}\n")
    print("RETRIEVED CHUNKS (cosine similarity is a relative ranking score, not a probability or confidence):")
    for c, score in retrieved:
        print(f"  - {c['source']} (chunk {c['index']}), similarity={score:.3f}")
        print(f"    {c['text']}")
    answer = generate_answer(question, retrieved)
    print(f"\nANSWER:\n{answer}\n")
    return retrieved, answer


if __name__ == "__main__":
    chunks, vectors = build_index()
    print(f"Indexed {len(chunks)} chunks ({vectors.shape[1]} dimensions each).")
    if len(sys.argv) > 1:
        ask(" ".join(sys.argv[1:]), chunks, vectors)
    else:
        while (q := input("\nAsk a question (empty to quit): ").strip()):
            ask(q, chunks, vectors)
