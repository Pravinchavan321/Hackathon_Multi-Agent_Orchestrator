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
   |                     v
   |              orchestrator_node
   |                     |
   |     +--(conditional routing on task_type)---------+
   |     |          |            |                     |
   |     v          v            v                     v
   | submission_  team_agent_  END (if 'unclear')  risk_agent_node
   | agent_node   node         (returns guidance)      |
   |     |          |                                  v
   |     |          |                         needs_approval edge
   |     |          |                             /         \
   |     |          |           (approval_required)          (auto_complete)
   |     |          |                   /                         \
   |     |          |                  v                           |
   |     |          |          human_approval_node                 |
   |     |          |          [interrupt_before gate]             |
   |     |          |                  |                           |
   |     +----------+------------------+---------------------------+
   |                                   |
   |                                   v
   |                                  END
   |
   |             tool calls (backend/ai/tools/*.py - Phase 6)
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
    task_type: str                  # routes orchestrator -> specialist | unclear
    hackathon_id: str | None
    current_agent: str
    tool_results: dict
    plan: list[dict] | None         # shown to user before execution
    requires_human_approval: bool
    final_result: dict | None
```

## Routing logic (orchestrator_node -> specialist / short-circuit)

### Top-Level Orchestrator Routing (`route_to_agent`)

| task_type | routes to | description |
|---|---|---|
| `submission` | `submission_agent` | Project evaluation, scoring (innovation, technical, completeness) |
| `risk` | `risk_agent` | Anomaly detection, suspicious voting patterns, collusion, plagiarism |
| `team` | `team_agent` | Skill gap analysis, teammate recommendations, role matching |
| `unclear` | `END` (short-circuit) | Greetings, ambiguous or vague input; returns clarification guidance |

`route_to_agent()` reads `state["task_type"]`, set by the orchestrator's
structured output LLM call reasoning over the incoming goal — not a keyword match.
If the input is vague or does not clearly map to a specialist domain, it routes
directly to `END` with a clarification payload in `final_result`.

### Risk Agent Approval Gate (`needs_approval`)

| condition | routes to | description |
|---|---|---|
| `state["requires_human_approval"] == True` | `human_approval` | High-risk action paused at `interrupt_before=["human_approval"]` waiting for reviewer decision |
| `state["requires_human_approval"] == False` | `END` | Low/medium risk analysis completes immediately |

## Specialist Agent Tools (ChromaDB Vector Integration)

### Submission Agent Tools (`backend/ai/tools/submission_tools.py`)
- `index_submission(submission_id, title, description)`: Upserts project submission into `submissions` collection.
- `find_similar_submissions(description, n_results=5)`: Semantic vector similarity search over existing submissions. Powers `novelty_assessment` and prior art detection.

### Team Agent Tools (`backend/ai/tools/team_tools.py`)
- `index_participant_skills(user_id, name, skills_bio)`: Upserts participant skills bio into `participant_skills` collection.
- `find_matching_participants(needed_skills_description, n_results=5)`: Semantic search over participant profiles to find teammates matching identified skill gaps.

## Structured Output Schemas Flowing through `final_result`

- **Submission Agent**: `{innovation_score, technical_score, completeness_score, summary, strengths, weaknesses, similar_submissions, novelty_assessment}`
- **Risk Agent**: `{risk_level, category, description, evidence}`
- **Team Agent**: `{recommendation_summary, missing_skills, suggested_roles, compatibility_reasoning, matched_participants}`
- **Human Approval Override**: `{status: "rejected_by_human" | "approved", decision, note, original_risk}`

## Human-in-the-loop

Any node that identifies a high-severity destructive action (e.g. `risk_level == "HIGH"`) sets `requires_human_approval = True`. The graph's conditional edge `needs_approval` routes execution toward `human_approval_node`, which is registered as an `interrupt_before` node in `builder.compile(interrupt_before=["human_approval"])`.
1. LangGraph pauses execution right before `human_approval_node`.
2. Reviewers inspect pending state via `GET /api/ai/tasks/{thread_id}/pending`.
3. To approve: `POST /api/ai/tasks/{thread_id}/approve` with `{"decision": "approve"}` calls `graph.ainvoke(None)` to resume execution to `END`.
4. To reject: `POST /api/ai/tasks/{thread_id}/approve` with `{"decision": "reject"}` calls `graph.aupdate_state()` with an override payload, ending the run without resuming destructive downstream actions.

## REST endpoints (mirrors original doc, trimmed to in-scope agents)

```
POST /api/ai/orchestrate                    -> starts a new graph run (NL goal)
GET  /api/ai/tasks/{thread_id}/pending      -> checks if task is paused at interrupt gate & returns pending payload
POST /api/ai/tasks/{thread_id}/approve      -> human-in-the-loop decision: approve (resumes) or reject (overrides)
GET  /api/ai/status                         -> AI system online/offline
```

## WebSocket endpoint

```
WS /ws/ai/tasks/{task_id}
```
Streams `astream_events(..., version="v2")` output — node transitions,
streamed LLM tokens, tool calls/results — serialized as JSON events for
the frontend `AIActivityTimeline` component.

