# Achievements

What we built or accomplished in each mission. Append a new `## Mission N` section per mission; don't create new files.

---

## Mission 1: Tiny RAG

**Goal:** the smallest useful RAG prototype from scratch (no frameworks, no vector DB), using local Ollama only.

**Delivered** (in `tiny-rag/`):
- `rag.py`: load docs, chunk by paragraph, embed with `mxbai-embed-large`, retrieve top 3 by cosine similarity (NumPy), answer with `llama3.2`, and print retrieved chunks with source file and score.
- `documents/`: 3 fictional "Veloria system" documents with distinct, testable facts.
- `test_rag.py`: checks document loading, chunking, embedding dimensions (1024), finite scores, zero-vector safety, retrieval for 3 questions, and an unrelated-question test.
- `requirements.txt`: `numpy`, `ollama`.
- Installed `numpy` and `ollama` into the `tiny-rag` conda env, with permission.

**Results:** all tests passed. Relevant chunks scored about 0.72-0.82 and the unrelated question about 0.33. The model correctly declined the unrelated question.

**Run:** `python rag.py` or `python test_rag.py` from `tiny-rag/` with the `tiny-rag` env active.
