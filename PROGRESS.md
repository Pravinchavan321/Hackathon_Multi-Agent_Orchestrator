# Progress Log

> Update this file at the END of every work session, even a short one.
> The "In progress" section is what a new session should read FIRST.

## Last updated
2026-08-22 — Phase 5 complete (Multi-agent conditional routing with 4 genuine LangGraph nodes: orchestrator, submission_agent, risk_agent, team_agent, all utilizing structured Pydantic outputs and verified).

## Last verified working state
LangGraph StateGraph with dynamic conditional routing (`orchestrator` -> `route_to_agent` -> `submission_agent` | `risk_agent` | `team_agent` -> `END`) compiled with `MongoDBSaver`. Routing verification test (`backend/tests/test_routing.py`) and persistence check passed with 100% success on `gemini-flash-lite-latest`.

---

## ✅ Done
- [x] Docker compose (mongo/redis/chroma)
- [x] FastAPI skeleton + /api/health (running on 8080 due to ChromaDB conflict on 8000)
- [x] React skeleton fetching /api/health
- [x] Single raw LLM call via /api/ai/ping (with 5-key fallback support)
- [x] 2-node LangGraph with Mongo checkpointing (prove persistence works)
- [x] WebSocket transport layer verified (lifecycle, intervals, cleanup)
- [x] Phase 5: Multi-agent conditional routing LangGraph with 4 nodes (orchestrator, submission_agent, risk_agent, team_agent) + structured Pydantic outputs

## 🚧 In progress (READ THIS BEFORE CONTINUING)
- Phase 6: Tools & ChromaDB integration
  - Seed script: fake submissions & users
  - Tools wired into specialist agents (submission analysis, risk detection, team matching)
  - ChromaDB semantic search integration

## ⬜ Not started
- [ ] Tools wired (submission analysis, risk detection, team matching)
- [ ] ChromaDB seeded + semantic search verified
- [ ] Human-in-the-loop interrupt on destructive action (Phase 7)
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
{"response":"Hello! ...","model":"gemini-flash-lite-latest"}
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
[2] Invoking graph on Thread A with message: 'This is my second message'
    [+] Messages after call 2: 6
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

### Checkpoint 4: WebSocket Transport & Streaming Verification (Phase 4 transport-only)
```
$ python -m backend.tests.test_ws_transport_only

======================================================================
  PHASE 4: WebSocket Transport & Lifecycle Test (TEMP-DEBUG Ping)
======================================================================
  Connecting to: ws://localhost:8080/ws/ai/tasks/debug-thread-01 ...
  [+] Connected in 2.203s
  [>] Sending: {"message": "__PING_TEST__"}

======================================================================
  RECEIVED STREAM EVENTS (with relative timestamps & inter-frame gaps):
======================================================================
  [  0.01s] (+ 0.01s gap) [EVENT] {'type': 'debug_event', 'index': 0, 'node': 'fake_node', 'content': 'fake streamed chunk #0'}
  [  1.01s] (+ 1.01s gap) [EVENT] {'type': 'debug_event', 'index': 1, 'node': 'fake_node', 'content': 'fake streamed chunk #1'}
  [  2.01s] (+ 0.99s gap) [EVENT] {'type': 'debug_event', 'index': 2, 'node': 'fake_node', 'content': 'fake streamed chunk #2'}
  [  3.00s] (+ 0.99s gap) [DONE] {'type': 'done'}

======================================================================
  VERIFICATION SUMMARY
======================================================================
  - Total frames received: 4
  - Debug events received: 3 / 3 expected
  - Inter-event intervals: ['0.01s', '1.01s', '0.99s', '0.99s']
  - Incremental gaps verified (~1.0s each): True
  - Done completion frame received: True
  - Clean websocket close: True
======================================================================
  [PASS] WebSocket transport layer, streaming & lifecycle fully verified!
======================================================================
```

### Checkpoint 5: Multi-Agent Conditional Routing & Specialist Execution (Phase 5)
```
$ python -m backend.tests.test_routing

======================================================================
  PHASE 5: CONDITIONAL ROUTING AND SPECIALIST AGENT VERIFICATION
======================================================================

[1] Running: Submission Analysis Test
    Message: "Please review our hackathon project 'DeFi Guardian'. It is an automated risk ana..."
    Thread ID: test-route-5980f096
    -> Orchestrator Task Type Decision : submission
    -> Orchestrator Reasoning          : The user is asking for a review and evaluation of a specific hackathon project ('DeFi Guardian') including its technical complexity, innovation, and completeness score, which falls directly under the submission domain.
    -> Landed at Agent Node            : submission_agent
    -> Requires Human Approval         : False
    -> Agent Structured Final Result   :
         innovation_score: 7.5
         technical_score: 8.0
         completeness_score: 6.5
         summary: DeFi Guardian is an automated risk analysis tool for liquidity pools, combining smart contracts in Solidity with a Next.js frontend interface. It aims to protect users by evaluating smart contract vulnerabilities and pool metrics in real-time.
         strengths: ['Practical and high-value use case in the DeFi security space', 'Solid tech stack combining Solidity smart contracts with a modern Next.js frontend', 'Automated approach reduces manual auditing overhead for users']
         weaknesses: ['Lack of detailed architectural specifics regarding the automated risk algorithms', 'Unclear how real-time data feeds and oracles are integrated', 'Frontend completeness and user testing results were not provided']
    [PASS] Successfully routed to submission_agent with valid structured result.

[2] Running: Risk Detection Test
    Message: "Warning: We noticed an anomalous spike of 500 upvotes for Team Alpha within 2 mi..."
    Thread ID: test-route-091c1add
    -> Orchestrator Task Type Decision : risk
    -> Orchestrator Reasoning          : The user input describes an anomalous voting spike and potential bot collusion, which directly falls under anomaly detection, suspicious voting patterns, and hackathon integrity risks handled by the risk agent.
    -> Landed at Agent Node            : risk_agent
    -> Requires Human Approval         : True
    -> Agent Structured Final Result   :
         risk_level: HIGH
         category: vote_brigading
         description: An anomalous spike of 500 upvotes originating from brand-new IP addresses within a very short timeframe of 2 minutes strongly indicates automated bot activity or coordinated vote brigading.
         evidence: 500 upvotes for Team Alpha within 2 minutes from brand-new IP addresses.
    [PASS] Successfully routed to risk_agent with valid structured result.

[3] Running: Team Matching Test
    Message: "Our team is building an AI-powered legal assistant for the hackathon. We current..."
    Thread ID: test-route-13995ef2
    -> Orchestrator Task Type Decision : team
    -> Orchestrator Reasoning          : The user is looking for specific teammates (Frontend React developer and UI/UX designer) to complement their existing backend developers for the hackathon project, which directly falls under the team matching and collaboration domain.
    -> Landed at Agent Node            : team_agent
    -> Requires Human Approval         : False
    -> Agent Structured Final Result   :
         recommendation_summary: The team is building an AI-powered legal assistant and currently has strong backend capabilities with two Python developers. To build a complete and user-friendly product, they urgently need frontend and design expertise.
         missing_skills: ['React', 'JavaScript', 'TypeScript', 'UI/UX Design', 'Figma', 'HTML/CSS']
         suggested_roles: ['Frontend React Developer', 'UI/UX Designer']
         compatibility_reasoning: While the existing Python developers can handle the backend APIs, AI integrations, and data processing, a dedicated Frontend React Developer is essential for building the interactive web interface. Additionally, a UI/UX Designer is critical for structuring complex legal workflows and document review interfaces into an intuitive, user-friendly experience.
    [PASS] Successfully routed to team_agent with valid structured result.

======================================================================
  ALL 3 ROUTING TESTS PASSED SUCCESSFULLY!
======================================================================
```

---

## Failure log

| Date | Issue | Root Cause | Fix |
|------|-------|-----------|-----|
| 2026-08-21 | FastAPI port conflict | ChromaDB already bound to 8000 | Moved FastAPI to port 8080 |
| 2026-08-21 | `gemini-1.5-pro` 404 | API keys only have Gemini 2.5/3.x models | Changed AI_MODEL to `gemini-flash-latest` |
| 2026-08-21 | Secret leak rejection on git push | `backend/.env` was tracked in git | Added `.env` to `.gitignore`, ran `git rm --cached`, amended commit |
| 2026-08-21 | Windows UnicodeEncodeError in test print | Terminal cp1252 cannot encode `\u2713` | Replaced unicode checkmarks with ASCII `[PASS]` |
| 2026-08-22 | `gemini-flash-latest` 429 quota exhaustion | Free-tier RPM on 3.7 preview is 20 RPM | Switched to `gemini-flash-lite-latest` which has sub-second structured output and ample quota |
| 2026-08-22 | Settings unable to locate `.env` from test runner | `pydantic-settings` searched cwd instead of backend folder | Updated `SettingsConfigDict` in `backend/core/config.py` to check both backend and root paths |

**Note:** FastAPI runs on port 8080 locally due to a port conflict with ChromaDB on port 8000.

