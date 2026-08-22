# Hackathon Multi-Agent Orchestrator

Start here. Read in this order:
1. `PROJECT_CONTEXT.md` — what this is, tech stack, scope
2. `PROGRESS.md` — exact current status, read the "In progress" section
3. `DECISIONS.md` — settled choices, don't relitigate these
4. `ARCHITECTURE.md` — graph structure, state shape, endpoints

## Quickstart
```bash
docker compose up -d          # mongo, redis, chromadb
cd backend
cp .env.example .env          # fill in AI_API_KEY at minimum
pip install -r requirements.txt
uvicorn main:app --reload

cd ../frontend
npm install
npm run dev
```

## For a new AI coding session (after login/quota switch)
Paste this as your first message to the agent:

> Read PROJECT_CONTEXT.md, PROGRESS.md, and DECISIONS.md before doing
> anything else, then tell me your understanding of current state before
> proceeding.

## After every work session
Update `PROGRESS.md` — move items from "In progress" to "Done", note any
blocker, and paste real command output into the checkpoint log section.
Commit to git. Do not end a session without both.

## Team Contribution

This project is being developed as a collaborative multi-agent AI system for automating hackathon management, including participant management, evaluation, orchestration, and workflow automation.


**Note:** FastAPI runs on port 8080 locally due to a port conflict with ChromaDB on port 8000.
