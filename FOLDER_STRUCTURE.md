# Complete Folder Structure

This is the full target structure for the scoped build (4 agents). Not
everything here exists yet — check PROGRESS.md for what's actually built.
Use this as the map when creating new files so nothing lands in the wrong
place.

```
hackathon-orchestrator/
│
├── PROJECT_CONTEXT.md              # read first, every session
├── PROGRESS.md                     # live status, update every session
├── DECISIONS.md                    # settled architectural choices
├── ARCHITECTURE.md                 # graph structure, state shape, endpoints
├── FOLDER_STRUCTURE.md             # this file
├── README.md                       # quickstart + session-start protocol
├── docker-compose.yml              # mongo, redis, chromadb
├── .gitignore
│
├── backend/
│   ├── main.py                     # FastAPI app, lifespan, mounts routers
│   ├── requirements.txt
│   ├── .env                        # real secrets, gitignored
│   ├── .env.example                # template, committed
│   │
│   ├── ai/
│   │   ├── __init__.py
│   │   ├── llm.py                  # ChatGoogleGenerativeAI client, single source
│   │   │
│   │   ├── graph/
│   │   │   ├── __init__.py
│   │   │   ├── state.py            # HackathonAgentState TypedDict
│   │   │   ├── build_graph.py      # StateGraph nodes + edges + compile
│   │   │   └── routing.py          # route_to_agent(), needs_approval()
│   │   │
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── orchestrator_agent.py
│   │   │   ├── submission_agent.py
│   │   │   ├── risk_agent.py
│   │   │   ├── team_agent.py
│   │   │   └── human_approval_node.py
│   │   │
│   │   ├── tools/
│   │   │   ├── __init__.py
│   │   │   ├── submission_tools.py  # detectSimilarSubmissions, analyze, etc.
│   │   │   ├── risk_tools.py        # detectScoringAnomaly, getSuspiciousActivity
│   │   │   ├── team_tools.py        # recommendTeammates, findBySkills
│   │   │   └── hackathon_tools.py   # getHackathon, getRegistrationStats
│   │   │
│   │   └── prompts/
│   │       ├── orchestrator_prompt.py
│   │       ├── submission_prompt.py
│   │       ├── risk_prompt.py
│   │       └── team_prompt.py
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── ai_router.py            # REST: /api/ai/*
│   │   ├── ws_router.py            # WebSocket: /ws/ai/tasks/{id}
│   │   └── health_router.py        # /api/health
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── mongo.py                # Motor client + Beanie init
│   │   ├── redis_client.py         # async redis client
│   │   └── chroma_client.py        # ChromaDB client + collection setup
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── ai_task.py               # Beanie Document: AITask
│   │   ├── ai_insight.py            # Beanie Document: AIInsight
│   │   ├── ai_risk.py               # Beanie Document: AIRisk
│   │   ├── ai_activity_log.py       # Beanie Document: AIActivityLog
│   │   ├── submission.py            # seed/demo data model
│   │   └── user.py                  # seed/demo data model
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                # pydantic-settings, reads .env
│   │   ├── logging.py               # structlog configuration
│   │   └── security.py              # JWT verify (only if auth kept in scope)
│   │
│   ├── scripts/
│   │   └── seed.py                  # loads fake submissions/users into Mongo + Chroma
│   │
│   └── tests/
│       ├── test_health.py
│       ├── test_graph_checkpoint.py # proves Mongo persistence works
│       └── test_tools.py
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env                          # VITE_API_URL, VITE_WS_URL
    │
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        │
        ├── api/
        │   ├── aiAPI.js               # REST calls to /api/ai/*
        │   └── ws.js                  # WebSocket connection helper
        │
        ├── components/
        │   ├── AIStatusBadge.jsx      # online/offline pill
        │   ├── AIOrchestrator.jsx     # NL goal input -> plan -> confirm -> run
        │   ├── AIActivityTimeline.jsx # live streamed agent progress
        │   ├── AIApprovalModal.jsx    # human-in-the-loop confirm dialog
        │   └── AIResultPanel.jsx      # final result / submission report view
        │
        ├── hooks/
        │   └── useAgentStream.js      # wraps ws.js, exposes events as state
        │
        └── pages/
            └── DemoPage.jsx            # single page, everything composed here
```

## Notes on scope
- No `pages/admin`, `pages/organizer`, `pages/judge`, `pages/participant`
  split — single `DemoPage.jsx` per the scope cut in PROJECT_CONTEXT.md.
- No `scheduler/` folder — manual trigger button replaces it (see
  DECISIONS.md, 2026-08-21 entry).
- `backend/tests/test_graph_checkpoint.py` is not optional — it's the
  Phase 3 checkpoint from the build order and the first thing likely to
  break.
