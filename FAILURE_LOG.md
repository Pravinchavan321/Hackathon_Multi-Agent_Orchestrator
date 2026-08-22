# Failure Log

> Honest account of every significant failure, unexpected behavior,
> and known limitation encountered across Phases 1–9.
> Each entry follows: Observed → Root Cause → Fix → Lesson.

---

### [Phase 2] — Gemini Quota Exhaustion (429 across all 5 API keys)

**Observed:** During initial LLM integration testing, every one of the 5 rotated
Gemini API keys returned HTTP 429 (Too Many Requests) within 10 minutes of
iterative development. The `gemini-1.5-pro` model was the first attempt,
which returned 404 (model not available on those keys). After switching to
`gemini-flash-latest` (3.7 preview), the 20 RPM free-tier quota was exhausted
almost immediately during rapid test-fix-rerun cycles.

**Root cause:** Two compounding issues: (1) the free-tier Gemini API keys only
had access to Gemini 2.5/3.x models, not `gemini-1.5-pro`, so the first model
choice was invalid; (2) `gemini-flash-latest` maps to the 3.7 preview which has
a strict 20 RPM limit on free tier. Running 4 test scenarios × multiple retries
× LangGraph node invocations burned through quota in seconds.

**Fix:** Switched `AI_MODEL` to `gemini-flash-lite-latest` which has
substantially higher free-tier RPM limits and sub-second structured output
latency. Added a 5-key rotation mechanism in `llm_provider.py` with
`itertools.cycle` so keys rotate on each call, spreading load across keys.

**Lesson:** Always check the quota tier of your API keys *before* choosing a
model. For hackathon development with rapid iteration, choose the cheapest
model that still produces valid structured output — the model quality difference
between flash and flash-lite is negligible for classification/routing tasks.

---

### [Phase 3] — MongoDBSaver Checkpointing Silent Empty State

**Observed:** When first wiring `MongoDBSaver` as the LangGraph checkpointer,
the graph appeared to run successfully but state was not persisting across
invocations. Calling `graph.get_state(thread_id)` after a completed run
returned `None` or empty values, making the interrupt-and-resume flow
impossible to implement.

**Root cause:** The `MongoDBSaver` was being instantiated but not correctly
passed to the `StateGraph.compile()` call. Additionally, the MongoDB connection
string needed to point to the Docker container's exposed port (`localhost:27017`)
and the `hackathon_db` database needed to exist before the checkpointer could
write. The checkpointer silently swallowed connection errors rather than raising.

**Fix:** Verified MongoDB container was running and accessible, ensured
`MongoDBSaver.create(conn_string, db_name)` was called with correct parameters,
and passed the resulting saver directly to `graph.compile(checkpointer=saver)`.
Added a dedicated persistence test (`test_graph_checkpoint.py`) that verifies:
(a) messages accumulate across calls on the same thread, (b) separate threads
are isolated, (c) state survives between independent graph invocations.

**Lesson:** Always write a persistence test *before* building features that
depend on persistence. Silent failures in checkpointers are especially
dangerous because the graph "works" on the happy path but breaks on resume.

---

### [Phase 5] — Orchestrator Fabricating Routing Justifications

**Observed:** When given ambiguous input like "Hello! What's up?", the
orchestrator LLM would sometimes fabricate a plausible-sounding routing
justification and classify it as `submission` or `team` rather than admitting
it didn't know. For example, it once routed "Hello" to `submission` with the
reasoning: "The user is greeting the system as a precursor to submitting their
project." This was a hallucinated intent that didn't exist in the input.

**Root cause:** The original routing prompt only offered 3 task type options:
`submission`, `risk`, `team`. With no explicit "I don't know" option, the LLM
was forced to pick one of the three, and it would confabulate reasoning to
justify whichever it picked. This is a well-documented LLM behavior — forced
classification without an escape hatch guarantees hallucinated justifications
on out-of-distribution inputs.

**Fix:** Added `unclear` as a 4th literal in the `TaskClassification` Pydantic
schema and explicitly instructed the prompt: "If the input is a generic
greeting, vague, or does not clearly match any specialist domain, you MUST
classify it as 'unclear'. Do NOT fabricate a plausible interpretation." After
this change, all ambiguous inputs consistently route to `unclear` with honest
reasoning like "The input is a standard greeting with no hackathon context."

**Lesson:** Every LLM classifier needs an explicit "none of the above" category.
Without it, the model *will* hallucinate justifications. This is not a model
quality issue — it happens with GPT-4, Claude, and Gemini equally. The fix is
always structural (add the escape hatch), not prompt-engineering ("please don't
make things up" doesn't work reliably).

---

### [Phase 4/8] — LangSmith API Key Missing (401 on Trace Ingest)

**Observed:** During Phase 8's observability pass, LangSmith trace ingestion
was returning HTTP 401 (Unauthorized). The `LANGCHAIN_TRACING_V2=true` flag
was set, which caused the LangChain SDK to attempt trace uploads on every
graph invocation, but every upload failed silently in the background. The
symptom was: no traces appeared in the LangSmith dashboard, and stderr showed
occasional `Failed to multipart ingest runs` warnings that were easy to miss.

**Root cause:** `LANGCHAIN_API_KEY` was not set in `backend/.env`. The tracing
flag was enabled in Phase 4 but the API key was never added because the original
developer assumed it would be configured later. Since LangSmith failures are
non-blocking (they log warnings but don't crash the app), the issue went
unnoticed until Phase 8 when traces were explicitly checked.

**Fix:** Generated a LangSmith API key from smith.langchain.com, added
`LANGCHAIN_API_KEY=lsv2_...` to `backend/.env`, set
`LANGCHAIN_PROJECT=hackathon-orchestrator` in both `.env` and `config.py`
(which exports it to `os.environ` on startup). Verified traces appeared in
the dashboard after running the test suite.

**Lesson:** Non-blocking observability failures are the most dangerous kind —
you think everything works until you check the dashboard and find it empty.
Add an explicit startup health check that verifies the observability pipeline
is actually receiving data, not just configured.

---

### [Phase 1] — Port Conflict: ChromaDB 8000 vs. FastAPI Default 8000

**Observed:** FastAPI's default `uvicorn` port is 8000. ChromaDB's Docker
container also binds to port 8000. Starting both caused an
`[Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000)`
on Windows, or silent request routing to ChromaDB instead of FastAPI.

**Root cause:** Both services defaulted to the same port and Docker Compose
exposed ChromaDB on the host's 8000 before FastAPI was started.

**Fix:** Moved FastAPI to port 8080 (`uvicorn backend.main:app --port 8080`)
and documented this in `PROGRESS.md`, `.env.example`, and all test scripts.

**Lesson:** Check for port conflicts *before* writing any code that assumes
a default port. With Docker Compose running multiple services, reserve ports
explicitly in a single config file and reference them everywhere.

---

### [Phase 6] — Semantic Similarity Scores Are Meaningful but Not Dramatic

**Observed:** ChromaDB cosine similarity scores between submissions and queries
typically fall in the 0.44–0.57 range. During early testing, this looked like
"everything matches poorly" because the intuitive expectation is scores near
0.9+ for strong matches. Stakeholders might question why a "clearly similar"
submission only scores 0.55.

**Root cause:** The `all-MiniLM-L6-v2` sentence transformer produces 384-dim
embeddings. Cosine similarity in high-dimensional spaces is naturally compressed
— scores rarely exceed 0.7 even for near-duplicate text. A score of 0.55 is
actually a strong semantic match in this embedding space; 0.30 is essentially
random. The absolute numbers are not meaningful without calibration against the
specific model and domain.

**Fix:** No code fix needed — this is expected behavior. The ranking is correct
(the most similar submissions always appear first), and the novelty assessment
text generated by the LLM correctly interprets the matches. However, this
should be explained to judges proactively: "These are cosine similarities in
384-dimensional embedding space — 0.55 is a strong match, not a weak one."

**Lesson:** Always calibrate similarity score expectations against the specific
embedding model. Display relative rankings ("most similar") rather than raw
scores in user-facing UI, or normalize scores to a 0–100 scale with the
model's empirical min/max.

---

### [Phase 9] — WebSocket Reconnection Not Implemented

**Observed:** If the backend goes down or the network drops while a WebSocket
stream is active, the frontend `useAgentStream` hook closes the connection
and sets `streaming = false`, but does not attempt reconnection. The user must
manually re-submit their query to get a new stream.

**Root cause:** Implementing robust WebSocket reconnection with exponential
backoff, state reconciliation (what events were missed during the disconnect),
and duplicate suppression is a non-trivial feature that was out of scope for
the hackathon timeline.

**Fix:** Not fixed — documented as a known limitation. The current behavior
is acceptable for a demo environment where the backend is running locally and
network drops are unlikely.

**Lesson:** For production, use a WebSocket library with built-in reconnection
(e.g., `reconnecting-websocket`) and implement server-side event replay from
the last acknowledged sequence number.

---

### [Phase 8] — Settings `.env` Path Resolution from Test Runner

**Observed:** When running tests via `python -m backend.tests.test_routing`
from the project root, Pydantic Settings could not find `backend/.env` because
it searched the current working directory (project root) rather than the
`backend/` subdirectory.

**Root cause:** `SettingsConfigDict(env_file=".env")` resolves relative to
`cwd`, not relative to the config module's file path. The test runner's `cwd`
was the project root, so it looked for `./.env` instead of `./backend/.env`.

**Fix:** Updated `SettingsConfigDict` in `backend/core/config.py` to check
both paths: `env_file=(".env", "backend/.env")`. Pydantic tries each path in
order and uses the first one found.

**Lesson:** Always make `.env` resolution robust to different working
directories. Hardcoding a single relative path breaks as soon as someone runs
from a different directory.

---

## Known Limitations (Honest Assessment)

1. **Model routing is probabilistic, not deterministic.** The orchestrator uses
   an LLM for intent classification. On borderline inputs (e.g., "our team
   submitted a risky project"), the routing decision can vary between runs.
   The `unclear` escape hatch catches most ambiguous cases, but edge cases
   exist where the model hedges.

2. **ChromaDB is single-instance.** All vector search queries hit one ChromaDB
   container. At ~100 concurrent users this is fine; at 10,000+ it becomes a
   bottleneck. Production would need Chroma's distributed mode or migration to
   a managed vector DB (Pinecone, Weaviate).

3. **No authentication or authorization.** The demo has no user login, no API
   key validation on the frontend, and no role-based access control on the
   approval endpoint. Anyone with the URL can approve or reject risk findings.

4. **Seed data is synthetic.** The 16 submissions and 10 participants are
   realistic but generated — the system has not been tested with real hackathon
   data at scale.

5. **LangSmith trace upload is fire-and-forget.** If the network is down or
   the API key expires, traces are silently dropped with no local buffer or
   retry queue.

---

## What I Would Fix With More Time

1. **Streaming token output** — Currently the WebSocket streams node-level
   events (start/end). With more time, I'd stream individual LLM tokens so the
   user sees the agent "thinking" in real-time, character by character.

2. **Deterministic routing tests** — Add a test suite of 50+ edge-case inputs
   with expected routing, run them 10x each, and measure routing accuracy as a
   percentage rather than pass/fail on 4 examples.

3. **WebSocket reconnection** — Implement `reconnecting-websocket` with
   server-side event replay from the last acknowledged event sequence number.

4. **Authentication** — Add JWT-based auth with role separation: `judge` role
   can approve/reject, `participant` role can only submit and view results.

5. **Rate limiting** — Add per-IP rate limiting on the `/orchestrate` endpoint
   to prevent abuse of the LLM API quota.
