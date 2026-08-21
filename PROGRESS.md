# Progress Log

> Update this file at the END of every work session, even a short one.
> The "In progress" section is what a new session should read FIRST.

## Last updated
2026-08-21 — Phase 2 complete (Raw LLM call via /api/ai/ping working end-to-end with Gemini 2.5 Flash).

## Last verified working state
Backend running on 8080 with Gemini 2.5 Flash responding. Frontend on 5173 fetching `/api/health`. `/api/ai/ping` returns real Gemini responses.

---

## ✅ Done
- [x] Docker compose (mongo/redis/chroma)
- [x] FastAPI skeleton + /api/health (running on 8080 due to ChromaDB conflict on 8000)
- [x] React skeleton fetching /api/health
- [x] Single raw LLM call via /api/ai/ping (gemini-2.5-flash, with 5-key fallback support)

## 🚧 In progress (READ THIS BEFORE CONTINUING)
- Task: Phase 3 — 2-node LangGraph with Mongo checkpointing
- Blocker: none
- Last error seen: n/a
- Next concrete step: Await Phase 3 prompt from user.

## ⬜ Not started
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
NAME               IMAGE             COMMAND                  SERVICE    CREATED         STATUS         PORTS
hackathon-chroma   chromadb/chroma   "dumb-init -- chroma…"   chromadb   15 minutes ago   Up 15 minutes   0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp
hackathon-mongo    mongo:7           "docker-entrypoint.s…"   mongo      15 minutes ago   Up 15 minutes   0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp
hackathon-redis    redis:7           "docker-entrypoint.s…"   redis      15 minutes ago   Up 15 minutes   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
```

### Checkpoint 2: FastAPI health
```
$ curl localhost:8080/api/health
{"status":"ok"}
```

### Checkpoint 2.5: AI Ping (Phase 2)
```
$ curl -X POST localhost:8080/api/ai/ping -H "Content-Type: application/json" -d '{"message": "say hello"}'
{"response":"Hello! ...","model":"gemini-2.5-flash"}
```

### Checkpoint 3: Mongo checkpoint persistence
```
[paste the two graph calls + proof state persisted across them]
```

---

## Failure log

| Date | Issue | Root Cause | Fix |
|------|-------|-----------|-----|
| 2026-08-21 | FastAPI port conflict | ChromaDB already bound to 8000 | Moved FastAPI to port 8080 |
| 2026-08-21 | `gemini-1.5-pro` 404 | API keys only have Gemini 2.5 models | Changed AI_MODEL to `gemini-2.5-flash` |
| 2026-08-21 | `gemini-1.5-flash` 404 | Same as above | Same fix |
| 2026-08-21 | `gemini-pro` 404 | Same as above | Same fix |

**Note:** FastAPI runs on port 8080 locally due to a port conflict with ChromaDB on port 8000.
