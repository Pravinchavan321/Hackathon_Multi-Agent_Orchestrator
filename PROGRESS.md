# Progress Log

> Update this file at the END of every work session, even a short one.
> The "In progress" section is what a new session should read FIRST.

## Last updated
2026-08-21 — initial scaffold created, no code written yet.

## Last verified working state
Nothing runs yet. This is a fresh scaffold.

---

## ✅ Done
- [ ] (nothing yet — check items as you complete them)

## 🚧 In progress (READ THIS BEFORE CONTINUING)
- Task: Phase 1 infrastructure skeleton (see PROJECT_CONTEXT.md scope)
- Blocker: none yet
- Last error seen: n/a
- Next concrete step: `docker compose up -d`, then confirm all 3
  containers (mongo, redis, chromadb) are healthy before writing any
  Python.

## ⬜ Not started
- [ ] Docker compose (mongo/redis/chroma)
- [ ] FastAPI skeleton + /api/health
- [ ] React skeleton fetching /api/health
- [ ] Single raw LLM call via /api/ai/ping (no graph yet)
- [ ] 2-node LangGraph with Mongo checkpointing (prove persistence works)
- [ ] WebSocket streaming on the 2-node graph
- [ ] Remaining 3 agent nodes added to graph
- [ ] Tools wired (submission analysis, risk detection, team matching)
- [ ] ChromaDB seeded + semantic search verified
- [ ] Human-in-the-loop interrupt on one destructive action
- [ ] LangSmith tracing enabled
- [ ] structlog wired into all agent nodes
- [ ] Seed script: 15-20 fake submissions, 10 fake users
- [ ] Frontend: AIOrchestrator input + live AIActivityTimeline
- [ ] Architecture diagram exported (1 page)
- [ ] Failure log written (ongoing — add entries as things break)

---

## Checkpoint verification log
(Paste real command output here as you hit each checkpoint — this is
what proves state to a new session, not just checked boxes.)

### Checkpoint 1: Infra up
```
$ docker compose ps
[paste output here]
```

### Checkpoint 2: FastAPI health
```
$ curl localhost:8080/api/health
[paste output here]
```

### Checkpoint 3: Mongo checkpoint persistence
```
[paste the two graph calls + proof state persisted across them]
```


**Note:** FastAPI runs on port 8080 locally due to a port conflict with ChromaDB on port 8000.
