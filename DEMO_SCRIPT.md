# Live Demo Script — 5 Minutes

> Rehearsed walk-through for the live judging slot.
> Practice this 3 times before the actual demo.

---

## Minute 0:00–0:30 — Setup (do before judges arrive)

```bash
# Terminal 1: Infrastructure
docker compose up -d          # MongoDB, Redis, ChromaDB all green

# Terminal 2: Seed vector database (only needed once)
python -m backend.scripts.seed

# Terminal 3: Backend
python -m uvicorn backend.main:app --port 8080

# Terminal 4: Frontend
cd frontend && npm run dev    # → localhost:5173
```

**Pre-flight checklist:**
- [ ] Browser open to `http://localhost:5173` — dark UI visible, green "Online" badge
- [ ] LangSmith dashboard open in second tab → `smith.langchain.com` → project `hackathon-orchestrator`
- [ ] `docker compose ps` shows all 3 containers healthy

---

## Minute 0:30–1:00 — Pitch (talk while browser is visible)

> "This is a multi-agent hackathon management system where genuinely
> separate AI agents cooperate through a shared state graph. If you
> remove the AI, it cannot function — there's no rule-based fallback
> for any of the three core capabilities: submission analysis, risk
> detection, and team matching."
>
> "Every decision flows through a LangGraph StateGraph with MongoDB
> checkpoint persistence, ChromaDB semantic vector search, and a native
> human-in-the-loop interrupt gate — not app-level if-checks."

---

## Minute 1:00–2:00 — Submission Analysis Demo

1. **Click example prompt 1** (AI legal assistant submission)
2. **Point at AIActivityTimeline** as events stream in live
3. **Say:**
   > "Watch — the orchestrator classifies the goal and routes to the
   > submission specialist. The submission agent then calls a ChromaDB
   > vector search tool to find semantically similar prior submissions —
   > not keyword matching, semantic embedding similarity using
   > all-MiniLM-L6-v2 sentence transformers."
4. **When result appears:** point at Similar Submissions table and
   novelty assessment
5. **Say:**
   > "It found prior art that shares no keywords with this submission
   > but is conceptually identical. The similarity scores are cosine
   > distances in 384-dimensional embedding space — 0.55 is a strong
   > match, not a weak one."

---

## Minute 2:00–3:00 — Human-in-the-Loop Demo (THE MOST IMPORTANT MINUTE)

1. **Click example prompt 2** (vote brigading risk)
2. **As timeline streams, say:**
   > "The risk agent detected a HIGH severity anomaly — now watch what
   > happens."
3. **When modal appears, say:**
   > "The graph has paused execution. It cannot proceed without a human
   > decision — this is LangGraph's `interrupt_before` mechanism, not an
   > app-level flag. The entire conversation state is persisted in MongoDB
   > between these two events."
4. **Type a reviewer note** (e.g., "Verified bot IP cluster on dashboard")
5. **Click Approve**, then say:
   > "The graph resumes from exactly where it paused. No state was lost,
   > no re-computation happened. This is real checkpoint-based resumption."

**Bonus (if time):** Repeat with a rejection to show the graph halts
without executing downstream actions.

---

## Minute 3:00–3:30 — Team Matching Demo

1. **Click example prompt 3** (DeFi team needs React dev)
2. **Point at matched participants with scores**
3. **Say:**
   > "Semantic skill matching — 'someone strong in React and Web3
   > frontend' matched Alice Chen's bio without a single keyword overlap.
   > The system found her through embedding similarity, not a skills
   > tag database."

---

## Minute 3:30–4:00 — Architecture (click "Show Architecture" button)

Walk judges through the diagram briefly:

> "Orchestrator receives natural language → classifies intent with
> structured LLM output → conditional routing to one of three specialist
> agents → each agent has ChromaDB tool access → risk agent has a
> human approval gate → everything checkpointed in MongoDB → all
> observable in LangSmith."

---

## Minute 4:00–4:30 — LangSmith (switch to second browser tab)

- Show the trace from the just-completed run
- Point out: node spans, tool calls, routing decisions, latency per node
- **Say:**
  > "Every LangGraph node, every tool call, every LLM invocation is
  > automatically traced here with zero manual instrumentation — just
  > `LANGCHAIN_TRACING_V2=true`."

---

## Minute 4:30–5:00 — Answer the 5 Judging Questions Proactively

1. **Who has this problem?**
   > Hackathon organizers running 100+ team events — they need automated
   > submission triage, integrity monitoring, and team formation at scale.

2. **Non-obvious hard part?**
   > Preventing the orchestrator from fabricating routing justifications
   > on ambiguous input — solved with the "unclear" 4th literal and
   > explicit prompt constraints. Without this, the LLM confabulates
   > plausible-sounding reasons to route greetings to specialist agents.

3. **What did YOU build vs. API call?**
   > The graph topology, routing logic, approval gate, ChromaDB semantic
   > pipeline, state schema, and structured output enforcement — the LLM
   > call itself is commodity. Remove Gemini, swap in any other model,
   > and the architecture is identical.

4. **Why does it break without AI?**
   > Semantic similarity cannot be replicated with keyword matching.
   > Intent routing cannot be replicated with regex. Risk reasoning
   > requires natural language understanding. All three core capabilities
   > are fundamentally LLM-dependent.

5. **What breaks at 10,000 users?**
   > ChromaDB single-instance becomes a bottleneck — need distributed
   > mode or Pinecone. MongoDBSaver under concurrent threads needs
   > connection pooling tuning. WebSocket worker count needs horizontal
   > scaling with Redis pub/sub relay for cross-worker event broadcast.

---

## Emergency Recovery

| Problem | Fix |
|---------|-----|
| Backend crashed | `python -m uvicorn backend.main:app --port 8080` |
| Frontend crashed | `cd frontend && npm run dev` |
| ChromaDB down | `docker compose restart chromadb` |
| MongoDB down | `docker compose restart mongo` |
| LLM 429 quota | Switch API key in `backend/.env`, restart uvicorn |
| LangSmith empty | Check `LANGCHAIN_API_KEY` in `.env`, restart uvicorn |
| UI shows "Offline" | Backend not running on 8080, check terminal |
