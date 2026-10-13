"""API tests. Ollama and rag calls are mocked, so no model or network is needed.

Run: python -m unittest test_api -v
"""
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

import api

FAKE_CHUNKS = [
    {"source": "document_2.txt", "index": 1, "text": "Tessaly has 14 moons."},
    {"source": "document_3.txt", "index": 0, "text": "Probe launched in 2031."},
]
FAKE_RETRIEVED = [(FAKE_CHUNKS[0], 0.751), (FAKE_CHUNKS[1], 0.412)]


class ApiTests(unittest.TestCase):
    def setUp(self):
        api._index = None
        self.client = TestClient(api.app)

    # 1. Health
    def test_health_ollama_up(self):
        fake = MagicMock()
        fake.list.return_value.models = [MagicMock(model="llama3.2:latest")]
        with patch("api.ollama.Client", return_value=fake):
            body = self.client.get("/api/health").json()
        self.assertEqual(body["api"], "ok")
        self.assertTrue(body["ollama"]["reachable"])
        self.assertTrue(body["ollama"]["models"]["generation"]["installed"])
        self.assertFalse(body["ollama"]["models"]["embedding"]["installed"])

    def test_health_ollama_unavailable(self):
        with patch("api.ollama.Client", side_effect=ConnectionError("boom /secret/path")):
            r = self.client.get("/api/health")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["api"], "ok")
        self.assertFalse(body["ollama"]["reachable"])
        self.assertIsNone(body["ollama"]["models"]["generation"]["installed"])
        self.assertNotIn("secret", r.text)

    # 2. Documents
    def test_documents_lists_real_files(self):
        body = self.client.get("/api/documents").json()
        names = [d["filename"] for d in body["documents"]]
        self.assertEqual(names, ["document_1.txt", "document_2.txt", "document_3.txt"])
        first = body["documents"][0]["chunks"][0]
        self.assertEqual(set(first), {"id", "source", "index", "text"})
        self.assertEqual(first["id"], "document_1.txt#0")

    # 3. Valid query
    def test_query_success_structure_and_order(self):
        with patch("api.rag.build_index", return_value=(FAKE_CHUNKS, None)), \
             patch("api.rag.retrieve", return_value=FAKE_RETRIEVED), \
             patch("api.rag.generate_answer", return_value="14 moons.") as gen:
            r = self.client.post("/api/query", json={"question": "  How many moons?  "})
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["mode"], "live")
        self.assertFalse(body["simulated"])
        self.assertEqual(body["question"], "How many moons?")  # whitespace stripped
        self.assertEqual(body["answer"], "14 moons.")
        self.assertIsNone(body["citations"])  # we do not claim which chunks were used
        self.assertEqual([c["score"] for c in body["retrieved"]], [0.751, 0.412])  # scores untouched
        self.assertEqual([c["rank"] for c in body["retrieved"]], [1, 2])
        self.assertEqual(body["retrieved"][0]["id"], "document_2.txt#1")
        self.assertEqual(set(body["retrieved"][0]), {"id", "source", "index", "text", "score", "rank"})
        gen.assert_called_once_with("How many moons?", FAKE_RETRIEVED)

    # 4. Invalid input
    def test_query_rejects_invalid_questions(self):
        for payload in ({"question": ""}, {"question": "   "}, {}, {"question": 5}, {"question": "x" * 2001}):
            with self.subTest(payload=payload if len(str(payload)) < 50 else "too long"):
                self.assertEqual(self.client.post("/api/query", json=payload).status_code, 422)

    # 5. Failures
    def test_query_retrieval_failure_is_503_without_leaking(self):
        with patch("api.rag.build_index", side_effect=RuntimeError("connect /Users/me/secret failed")):
            r = self.client.post("/api/query", json={"question": "hi"})
        self.assertEqual(r.status_code, 503)
        self.assertEqual(r.json()["detail"]["code"], "retrieval_failed")
        self.assertNotIn("/Users", r.text)
        self.assertNotIn("Traceback", r.text)

    def test_query_generation_failure_is_502_with_real_evidence_and_no_answer(self):
        with patch("api.rag.build_index", return_value=(FAKE_CHUNKS, None)), \
             patch("api.rag.retrieve", return_value=FAKE_RETRIEVED), \
             patch("api.rag.generate_answer", side_effect=RuntimeError("model not found /Users/me")):
            r = self.client.post("/api/query", json={"question": "hi"})
        self.assertEqual(r.status_code, 502)
        detail = r.json()["detail"]
        self.assertEqual(detail["code"], "generation_failed")
        self.assertNotIn("answer", detail)
        self.assertEqual(len(detail["retrieved"]), 2)
        self.assertNotIn("/Users", r.text)

    def test_cors_allows_vite_origin_only(self):
        ok = self.client.options("/api/query", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"})
        self.assertEqual(ok.headers.get("access-control-allow-origin"), "http://localhost:5173")
        self.assertNotIn("access-control-allow-credentials", ok.headers)
        bad = self.client.options("/api/query", headers={"Origin": "http://evil.example", "Access-Control-Request-Method": "POST"})
        self.assertNotIn("access-control-allow-origin", bad.headers)


if __name__ == "__main__":
    unittest.main()
