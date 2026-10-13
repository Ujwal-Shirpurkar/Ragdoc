# Concepts Learned

Plain-English notes on the ideas behind each mission. Append a new `## Mission N` section per mission.

---

## Mission 1: Tiny RAG

- **Chunk:** a small piece of a document (here, one paragraph) tagged with its source file and index. Small pieces let us retrieve only the relevant part. (`chunk_documents`)
- **Embedding:** a list of numbers (1024 for `mxbai-embed-large`) encoding the meaning of a text. Similar meanings give similar vectors, so we search by meaning, not keywords. (`embed`)
- **Cosine similarity:** the angle between two vectors, ignoring length. After normalizing to length 1, a dot product gives it. Closer to 1 means more similar. It is a relative ranking score, **not** a probability or confidence. (`normalize`, `retrieve`)
- **Zero-norm vectors:** dividing by length 0 breaks, so `normalize` leaves all-zero vectors as zeros.
- **How chunks reach the LLM:** the top chunks' text is pasted into the prompt next to the question. The model sees only what's in the prompt. (`generate_answer`)
- **Why it's RAG:** retrieve relevant text from your own data first, then generate an answer from it.
- **Limitation:** the answer is only as good as retrieval and the model. If the right chunk isn't in the top 3, the answer fails. Even with the right chunk, a small model can ignore it. Paragraph chunking can split related facts.
- **Prompting isn't a guarantee:** telling the model "don't invent facts" reduces fabrication but doesn't prevent mistakes, so check actual outputs.
