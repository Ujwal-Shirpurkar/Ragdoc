"""Thin HTTP layer over rag.py. All retrieval and generation logic lives in rag.py."""
import logging
import os
import threading
from typing import Annotated

import ollama
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, StringConstraints

import rag

log = logging.getLogger("tiny-rag-api")

# Comma-separated list. Defaults to the local Vite dev server only.
CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get("RAG_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if o.strip()
]

app = FastAPI(title="Tiny RAG API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# The index needs Ollama (it embeds every chunk), so it is built on the first query
# instead of at startup. That keeps the API (and /api/health) usable when Ollama is down.
_index = None
_index_lock = threading.Lock()


def get_index():
    global _index
    with _index_lock:
        if _index is None:
            _index = rag.build_index()
        return _index


class QueryRequest(BaseModel):
    question: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


def chunk_id(chunk):
    return f"{chunk['source']}#{chunk['index']}"


def error(status, code, message, **extra):
    # Messages are fixed strings: no stack traces or local paths reach the client.
    return HTTPException(status_code=status, detail={"code": code, "message": message, **extra})


@app.get("/api/health")
def health():
    """API health is separate from Ollama connectivity. Only lists models; no embedding or generation."""
    models = {"embedding": rag.EMBED_MODEL, "generation": rag.LLM_MODEL}
    ollama_status = {"reachable": False, "models": {}}
    try:
        installed = [m.model for m in ollama.Client(timeout=2).list().models]
        ollama_status["reachable"] = True
        for role, name in models.items():
            ollama_status["models"][role] = {
                "name": name,
                "installed": any(i == name or i.startswith(name + ":") for i in installed),
            }
    except Exception:
        log.warning("Ollama health check failed", exc_info=True)
        ollama_status["models"] = {role: {"name": name, "installed": None} for role, name in models.items()}
    return {"api": "ok", "ollama": ollama_status}


@app.get("/api/documents")
def documents():
    """Same loading and chunking as rag.py. Does not need Ollama."""
    chunks = rag.chunk_documents(rag.load_documents())
    return {
        "documents": [
            {
                "filename": name,
                "chunks": [
                    {"id": chunk_id(c), "source": c["source"], "index": c["index"], "text": c["text"]}
                    for c in chunks
                    if c["source"] == name
                ],
            }
            for name in rag.load_documents()
        ]
    }


@app.post("/api/query")
def query(req: QueryRequest):
    try:
        chunks, vectors = get_index()
        retrieved = rag.retrieve(req.question, chunks, vectors)
    except Exception:
        log.exception("Retrieval failed")
        raise error(503, "retrieval_failed", "Could not embed or search. Is Ollama running with the embedding model installed?")

    # Order and scores are exactly what rag.retrieve returned.
    evidence = [
        {"id": chunk_id(c), "source": c["source"], "index": c["index"], "text": c["text"], "score": score, "rank": i + 1}
        for i, (c, score) in enumerate(retrieved)
    ]

    try:
        answer = rag.generate_answer(req.question, retrieved)
    except Exception:
        log.exception("Generation failed")
        # Retrieval succeeded, so return it: the evidence is real, but there is no answer.
        raise error(502, "generation_failed", "Retrieval worked but the language model failed to answer. Is Ollama running with the generation model installed?", retrieved=evidence)

    return {
        "mode": "live",
        "simulated": False,
        "question": req.question,
        "answer": answer,
        "retrieved": evidence,
        "models": {"embedding": rag.EMBED_MODEL, "generation": rag.LLM_MODEL},
        # The backend cannot tell which retrieved chunks the model actually used.
        "citations": None,
    }
