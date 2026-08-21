# Architecture

Text-first on purpose — an AI coding agent parses this far more reliably
than an image. Keep this in sync whenever the graph shape changes.

## System diagram (textual)

```
React (Vite + Tailwind)
   |
   |-- REST -------> FastAPI routers/ai_router.py
   |                     |
   |-- WebSocket --> FastAPI routers/ws_router.py
   |                     |
   |                     v
   |            LangGraph orchestrator graph
   |            (backend/ai/graph/build_graph.py)
   |                     |
   |     +---------------+---------------+
   |     |               |               |
   |     v               v               v
   | orchestrator_node  human_approval_node (interrupt_before)
   |     |
   |     +--(conditional routing on task_type)--+
   |     |          |            |               |
   |     v          v            v               v
   | organizer_  submission_  risk_agent_    team_agent_
   | agent_node  agent_node   node           node
   |     |          |            |               |
   |     +----------+------------+---------------+
   |                     |
   |             tool calls (backend/ai/tools/*.py)
   |                     |
   |     +---------------+----------------+
   |     |               |                |
   |     v               v                v
   |  MongoDB          Redis           ChromaDB
   | (state via      (cache +      (submission +
   |  MongoDBSaver,    pub/sub for   skill embeddings,
   |  + AITask/        multi-worker  semantic search)
   |  AIInsight/       WS relay)
   |  AIRisk/
   |  AIActivityLog
   |  collections)
```

All agent + tool + LLM calls are traced to **LangSmith** automatically
once `LANGCHAIN_TRACING_V2=true` is set — no manual instrumentation.
All logs go through `structlog` (`backend/core/logging.py`).

## State object (single source of truth for what flows between agents)

```python
class HackathonAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    task_type: str                  # routes orchestrator -> specialist
    hackathon_id: str | None
    current_agent: str
    tool_results: dict
    plan: list[dict] | None         # shown to user before execution
    requires_human_approval: bool
    final_result: dict | None
```

## Routing logic (orchestrator_node -> specialist)

| task_type | routes to |
|---|---|
| `organizer.*` | `organizer_agent_node` |
| `submission.*` | `submission_agent_node` |
| `risk.*` | `risk_agent_node` |
| `team.*` | `team_agent_node` |

`route_to_agent()` reads `state["task_type"]`, set by the orchestrator's
own LLM call reasoning over the incoming NL goal — not a keyword match.

## Human-in-the-loop

Any node that would perform a "destructive" action (mass message, publish
result, reject a submission) sets `requires_human_approval = True` and the
graph's conditional edge routes to `human_approval_node`, which is
registered as an `interrupt_before` node. Execution pauses; resuming
requires a REST call: `POST /api/ai/tasks/{task_id}/approve`.

## REST endpoints (mirrors original doc, trimmed to in-scope agents)

```
POST /api/ai/orchestrate            -> starts a new graph run (NL goal)
GET  /api/ai/tasks/{id}             -> task status + result
POST /api/ai/tasks/{id}/approve     -> resumes an interrupted graph
GET  /api/ai/insights/{hackathon_id}
GET  /api/ai/risks/{hackathon_id}
GET  /api/ai/status                 -> AI system online/offline
```

## WebSocket endpoint

```
WS /ws/ai/tasks/{task_id}
```
Streams `astream_events(..., version="v2")` output — node transitions,
streamed LLM tokens, tool calls/results — serialized as JSON events for
the frontend `AIActivityTimeline` component.
