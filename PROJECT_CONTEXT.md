# Project: AI Autonomous Hackathon Orchestrator

## What this is
A multi-agent hackathon management system built for the **Multi-Agent /
Agents & Automation track**. The core deliverable is a LangGraph-based
orchestrator where specialist AI agents genuinely cooperate (shared state,
conditional routing, human-in-the-loop approval) — not a single-prompt
wrapper. Frontend in React, backend in FastAPI.

**The one test every feature must pass:** if you remove the AI, does this
still work? If yes, it doesn't belong in the demo.

## Current phase
Phase 9 — **Project Complete**. All 9 phases built and verified. See `PROGRESS.md`
for checkpoint verification log and `FAILURE_LOG.md` for honest failure audit.

## Tech stack (locked — do not change without updating this file AND DECISIONS.md)

| Layer | Choice |
|---|---|
| Backend framework | FastAPI (Python 3.11+) |
| Agent orchestration | LangGraph (StateGraph, not a manual agent loop) |
| LLM provider | Google Gemini via `langchain-google-genai` |
| LLM abstraction | LangChain `@tool` decorated functions |
| Vector store | ChromaDB (submissions + skill embeddings) |
| Primary DB | MongoDB via Motor + Beanie ODM |
| Cache / pub-sub | Redis (async, `redis-py`) |
| Realtime transport | WebSockets (native FastAPI, `astream_events` v2) |
| Observability | LangSmith (tracing) + `structlog` (structured logs) |
| Frontend | React + Vite + TailwindCSS |
| State persistence | `MongoDBSaver` checkpointer, `thread_id` = `task_id` |

## Key architectural decisions (do not relitigate these — see DECISIONS.md for why)
- Agents are **LangGraph nodes** (functions), not separate service classes.
- State flows through one shared `TypedDict` (`HackathonAgentState`) — this
  IS the proof of multi-agent cooperation for the judges.
- Destructive/high-impact actions route through `interrupt_before` —
  human-in-the-loop is enforced by the graph, not by app-level if-checks.
- No arbitrary DB queries from the LLM — only named, typed tool functions.
- User-submitted text is always labeled `[USER_CONTENT]` before being
  interpolated into any prompt (prompt-injection guard).

## Scope for this build (24-hour reality — do not exceed this)
**In scope — 4 agents:**
1. Orchestrator Agent (routes NL goals to the right specialist)
2. Submission Analyzer Agent (scores + detects similar submissions via Chroma)
3. Risk Detector Agent (flags anomalies)
4. Team Matcher Agent (semantic skill matching)

**Explicitly cut — do not build unless core is done early:**
- Full RBAC / multiple role dashboards (single demo user only)
- Background scheduler (manual "run" button instead of setInterval/celery)
- Real email/notification sending (mocked only)
- Multi-provider LLM abstraction beyond Gemini

## Where to find things
```
backend/ai/agents/     -> one file per agent node function
backend/ai/tools/      -> @tool decorated functions, grouped by domain
backend/ai/graph/      -> state.py (TypedDict) + build_graph.py
backend/ai/prompts/    -> system prompt templates, one per agent
backend/routers/       -> ai_router.py (REST), ws_router.py (WebSocket)
backend/db/            -> mongo.py, redis_client.py, chroma_client.py
backend/models/        -> Beanie documents (AITask, AIInsight, AIRisk, AIActivityLog)
backend/core/          -> logging.py (structlog), security.py (JWT, if used)
backend/scripts/seed.py -> loads fake submissions/users into Mongo + Chroma
frontend/src/          -> single-page demo UI (Orchestrator input + live timeline)
```

## Session start protocol
Every new agent session (especially after a login/quota switch) MUST:
1. Read this file, `PROGRESS.md`, and `DECISIONS.md` in full.
2. State its understanding of current status before writing any code.
3. Run `git log --oneline -20` and `git status` to confirm what's actually
   on disk matches what `PROGRESS.md` claims.

---

## Final State (as of Phase 9 completion)

### Agents — All Real (Not Stubs)
| Agent | File | Status | LLM-Dependent |
|-------|------|--------|----------------|
| Orchestrator | `backend/ai/agents/orchestrator_agent.py` | ✅ Real — structured intent classification via Gemini | Yes — routes on semantic meaning |
| Submission Analyzer | `backend/ai/agents/submission_agent.py` | ✅ Real — scores + ChromaDB novelty assessment | Yes — generates scores and analysis |
| Risk Detector | `backend/ai/agents/risk_agent.py` | ✅ Real — anomaly classification + human gate | Yes — classifies risk severity |
| Team Matcher | `backend/ai/agents/team_agent.py` | ✅ Real — ChromaDB skill matching + recommendations | Yes — generates compatibility reasoning |
| Human Approval | `backend/ai/agents/human_approval_node.py` | ✅ Real — `interrupt_before` gate with approve/reject | No — pure state mutation |

### Tools — All Wired to ChromaDB
| Tool | File | Collection |
|------|------|------------|
| `index_submission` | `submission_tools.py` | `submissions` |
| `find_similar_submissions` | `submission_tools.py` | `submissions` |
| `index_participant_skills` | `team_tools.py` | `participant_skills` |
| `find_matching_participants` | `team_tools.py` | `participant_skills` |

### Seed Data
- **16 submissions** across 8 domains (EdTech, DeFi, HealthTech, DevTools, Sustainability, LegalTech, Gaming, Security)
- **10 participants** with diverse skill bios (frontend, backend, ML, security, design, mobile, blockchain)
- Embeddings: `all-MiniLM-L6-v2` (384-dim, local ONNX inference)

### Known Limitations
1. **Routing is probabilistic** — borderline inputs may classify differently across runs; the `unclear` escape hatch mitigates but doesn't eliminate this.
2. **ChromaDB is single-instance** — adequate for demo; production needs distributed mode or a managed vector DB for >1000 concurrent queries.
3. **No authentication** — the demo has no user login or role-based access control; anyone with the URL can approve/reject risk findings.

