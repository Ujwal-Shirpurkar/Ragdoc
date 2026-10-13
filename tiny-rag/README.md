# Tiny RAG

Local RAG prototype: `rag.py` (retrieval + generation with Ollama), `api.py` (thin FastAPI layer), `frontend/` (React UI).

## Setup (existing `tiny-rag` conda env)
```
conda activate tiny-rag
pip install -r requirements.txt        # numpy, ollama, fastapi, uvicorn
cd frontend && npm install && cd ..
```
Ollama must be running with `llama3.2` and `mxbai-embed-large` pulled.

## Run
```
# terminal 1: backend  (http://localhost:8000)
conda activate tiny-rag
uvicorn api:app --port 8000

# terminal 2: frontend (http://localhost:5173)
cd frontend && npm run dev
```
Optional: `RAG_CORS_ORIGINS="http://localhost:5173"` (comma-separated; default is the Vite dev origin only) and `VITE_API_BASE` in the frontend (default `http://localhost:8000`).

## Tests
```
python test_rag.py                     # needs live Ollama
python -m unittest test_api -v         # mocked, no Ollama needed
cd frontend && npm run build && npx oxlint .
```

## API
- `GET /api/health` -> `{api, ollama: {reachable, models: {embedding|generation: {name, installed}}}}`. Lists models only; runs no embedding or generation.
- `GET /api/documents` -> `{documents: [{filename, chunks: [{id, source, index, text}]}]}`
- `POST /api/query` `{question}` -> `{mode: "live", simulated: false, question, answer, retrieved: [{id, source, index, text, score, rank}], models, citations: null}`
  - `retrieved` keeps the exact order and cosine scores from `rag.retrieve`. `citations` is `null` because the backend cannot tell which chunks the model used.
  - 422 invalid question; 503 `retrieval_failed` (embedding/Ollama); 502 `generation_failed` (includes the real `retrieved` evidence, no answer).
