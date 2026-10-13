"""Basic checks. Run: python test_rag.py"""
import numpy as np
import rag

docs = rag.load_documents()
assert len(docs) == 3, docs.keys()
print("OK: 3 documents loaded:", list(docs))

chunks, vectors = rag.build_index()
assert len(chunks) > 0
print(f"OK: {len(chunks)} chunks")

assert vectors.ndim == 2 and vectors.shape[0] == len(chunks)
print(f"OK: embeddings consistent, dim={vectors.shape[1]}")

# zero-norm safety
assert np.all(np.isfinite(rag.normalize(np.zeros((2, 4)))))
print("OK: zero vector normalizes safely")

for question, expected_file in [
    ("How many moons does Tessaly have?", "document_2.txt"),
    ("When was the Veloria Survey Probe launched?", "document_3.txt"),
    ("How long does sunlight take to reach Kelmora?", "document_1.txt"),
]:
    retrieved, answer = rag.ask(question, chunks, vectors)
    scores = [s for _, s in retrieved]
    assert all(np.isfinite(scores)), scores
    assert expected_file in [c["source"] for c, _ in retrieved], "expected source not retrieved"
    print(f"OK: retrieved {expected_file} for: {question}")

# Unrelated question: we print the real answer for a human to judge; we only
# do a crude automatic check, since prompting alone does not guarantee factuality.
retrieved, answer = rag.ask("Who won the 1998 FIFA World Cup?", chunks, vectors)
admits = any(p in answer.lower() for p in ("does not contain", "not enough information", "insufficient", "no information"))
print("Unrelated question: model admitted insufficient context ->", admits)
assert admits, "Model may have fabricated an answer - read it above"
