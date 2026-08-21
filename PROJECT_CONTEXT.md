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
Phase 0 — scaffolding. See `PROGRESS.md` for exact live status; that file
is the source of truth, not this one.

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
