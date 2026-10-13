# Problems Faced

Issues we hit, what caused them, and how we handled them (or didn't). Append a new `## Mission N` section per mission.

---

## Mission 1: Tiny RAG

### 1. Missing packages in the conda env
- **Problem:** `numpy` and `ollama` were not installed in `tiny-rag`.
- **Resolution:** asked first, then ran `pip install numpy ollama` in that env only.

### 2. Model contradicted itself despite correct retrieval
- **Problem:** for "How long does sunlight take to reach Kelmora?", the right chunk ranked first ("light takes exactly 9 minutes"). `llama3.2` still said the context was insufficient, then described the 9 minutes in the next sentence.
- **Cause:** a generation failure in a small model, not a retrieval failure.
- **Status:** **unresolved.** The automated test only checks retrieval for that question, so it passed. We left it as an honest example.
- **Ideas for later:** a stricter prompt, a larger model, or tests that check the answer text.

### 3. Unrelated-question test is weak
- **Problem:** the test looks for phrases like "does not contain". It passed once, but one run proves little, and prompting doesn't guarantee factuality.
- **Status:** open. It needs manual review and repeated runs.

### 4. Project layout
- **Note:** the project root already had a git repo and README, so the code went in a `tiny-rag/` subfolder instead of the root.
