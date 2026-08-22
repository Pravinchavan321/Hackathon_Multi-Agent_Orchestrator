# Decisions Log

> Append-only. Never delete an old entry, even if superseded — add a new
> entry that says what changed and why. A new agent session should trust
> the MOST RECENT entry on any given topic.

---

### 2026-08-21 — LLM provider: Gemini
Chose Google Gemini (`langchain-google-genai`) over OpenAI. Reason: team
already has an API key, no billing setup friction during the event.
**Impact:** all agent nodes call through `backend/ai/llm.py`, never the
SDK directly, so swapping providers later only touches one file.

### 2026-08-21 — Cut RBAC entirely
Single hardcoded demo user/role for the whole app. Full RBAC from the
original MERN plan is not worth the time for a 24-hour build and is not
demo-visible to judges.

### 2026-08-21 — Cut background scheduler
No `setInterval`/celery periodic jobs. Replaced with a manual "Run Agent"
button in the UI. Judges see the same agent behavior on demand, and it
removes a whole class of async bugs from the critical path.

### 2026-08-21 — Agents are graph nodes, not classes
Rejected the original per-agent-file service class pattern
(`organizerAgent.js` style) in favor of LangGraph node functions sharing
one `TypedDict` state. Reason: this is what makes "genuine multi-agent
cooperation" provable to judges — state literally passes between nodes,
visible in LangSmith traces.

### 2026-08-21 — State persistence: MongoDBSaver, not custom
Using LangGraph's built-in `MongoDBSaver` checkpointer instead of hand
-rolling task status in a custom `AITask` collection update loop. `thread_id`
= the task's Mongo `_id` string, so REST lookups and graph state share the
same key.

### 2026-08-21 — Human-in-the-loop via `interrupt_before`
Using LangGraph's native interrupt mechanism instead of app-level
"pending approval" flags checked manually in controllers. The graph
itself pauses; a REST call resumes it. Simpler and matches the brief's
"handle destructive actions safely" constraint more literally.

### 2026-08-22 — Model Selection: `gemini-flash-lite-latest`
Set `AI_MODEL=gemini-flash-lite-latest` as primary default. It supports
fast structured outputs via `with_structured_output()` and avoids the
strict 20 RPM free-tier limits of preview flash models while maintaining
high reasoning fidelity across orchestrator and specialist agent nodes.

### 2026-08-22 — Orchestrator Routing via Pydantic `RouteDecision`
Orchestrator enforces structured schema (`Literal["submission", "risk", "team", "unclear"]`
with reasoning string). This guarantees deterministic conditional routing in
`route_to_agent()` while preserving full LLM semantic classification power.

### 2026-08-22 — Orchestrator Ambiguity Hardening: Explicit `unclear` Route
Added `unclear` as a 4th routing target in `RouteDecision` and `route_to_agent()`.
Previously, the orchestrator hallucinated/rationalized routing vague messages (like
greetings or unspecific queries) to `submission_agent`. The orchestrator prompt now
strictly mandates `unclear` if input does not explicitly match a specialist domain,
short-circuiting the graph directly to `END` with a clarification request rather than
propagating unspecific context to specialist agents.

### 2026-08-22 — Embedding Function: ChromaDB `DefaultEmbeddingFunction` (all-MiniLM-L6-v2)
Chose ChromaDB's built-in local `DefaultEmbeddingFunction` (`all-MiniLM-L6-v2` via ONNX)
over Google Generative AI remote embeddings (`GoogleGenerativeAIEmbeddings`).
**Reasoning:**
1. Zero API Quota & Billing Friction: Runs 100% locally offline, protecting against external rate limits/429 quotas.
2. Latency: Sub-millisecond vector inference on queries vs 200-500ms network round-trips for remote embedding endpoints.
3. Quality: 384-dimensional dense embeddings are purpose-tuned for sentence/paragraph semantic similarity (project descriptions and skill bios).

<!-- Add new entries below this line, newest at the bottom -->


