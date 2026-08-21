# Progress Log

> Update this file at the END of every work session, even a short one.
> The "In progress" section is what a new session should read FIRST.

## Last updated
2026-08-21 — Phase 3 complete (2-node LangGraph compiled with MongoDBSaver checkpointing; state persistence across calls and thread isolation fully verified).

## Last verified working state
Backend on port 8080. LangGraph StateGraph (orchestrator -> submission_agent) compiling with MongoDBSaver. Checkpoint test passed: state accumulates messages on same thread_id and isolates separate thread_ids.

---

## ✅ Done
- [x] Docker compose (mongo/redis/chroma)
- [x] FastAPI skeleton + /api/health (running on 8080 due to ChromaDB conflict on 8000)
- [x] React skeleton fetching /api/health
- [x] Single raw LLM call via /api/ai/ping (gemini-flash-latest, with 5-key fallback support)
- [x] 2-node LangGraph with Mongo checkpointing (prove persistence works)

## 🚧 In progress (READ THIS BEFORE CONTINUING)
- Task: Phase 4 — WebSocket streaming on the 2-node graph
- Blocker: none
- Last error seen: n/a
- Next concrete step: Await Phase 4 prompt from user.

## ⬜ Not started
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
{"response":"Hello! ...","model":"gemini-flash-latest"}
```

### Checkpoint 3: Mongo checkpoint persistence (Phase 3)
```
$ python -m backend.tests.test_graph_checkpoint

============================================================
  Phase 3 Checkpoint Persistence Test
============================================================
  Thread A: test-thread-ae301591
  Thread B: test-thread-1641bb14
============================================================

[1] Invoking graph on Thread A with message: 'Hello, first message'
    [+] Messages after call 1: 3
      [human] Hello, first message
      [ai] Hello! Welcome. How can I help you today?
      [ai] Submission agent received the task.

[2] Invoking graph on Thread A with message: 'This is my second message'
    [+] Messages after call 2: 6
      [human] Hello, first message
      [ai] Hello! Welcome. How can I help you today?
      [ai] Submission agent received the task.
      [human] This is my second message
      [ai] Loud and clear—message number two received!
      [ai] Submission agent received the task.

============================================================
  PERSISTENCE CHECK
============================================================
  [PASS] Both human messages found in Thread A state!
         Total messages: 6 (was 3 in call 1)

[3] Invoking graph on Thread B with message: 'Thread B only'
    [+] Messages in Thread B: 3

============================================================
  ISOLATION CHECK
============================================================
  [PASS] Thread B does NOT contain Thread A's messages!
         Thread B human messages: ['Thread B only']

============================================================
  TEST COMPLETE - ALL CHECKS PASSED
============================================================
```

---

## Failure log

| Date | Issue | Root Cause | Fix |
|------|-------|-----------|-----|
| 2026-08-21 | FastAPI port conflict | ChromaDB already bound to 8000 | Moved FastAPI to port 8080 |
| 2026-08-21 | `gemini-1.5-pro` 404 | API keys only have Gemini 2.5/3.x models | Changed AI_MODEL to `gemini-flash-latest` |
| 2026-08-21 | Secret leak rejection on git push | `backend/.env` was tracked in git | Added `.env` to `.gitignore`, ran `git rm --cached`, amended commit |
| 2026-08-21 | Windows UnicodeEncodeError in test print | Terminal cp1252 cannot encode `\u2713` | Replaced unicode checkmarks with ASCII `[PASS]` |

**Note:** FastAPI runs on port 8080 locally due to a port conflict with ChromaDB on port 8000.
