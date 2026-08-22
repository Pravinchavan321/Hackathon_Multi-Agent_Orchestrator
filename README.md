# Hackathon Multi-Agent Orchestrator

A production-oriented **AI-powered multi-agent orchestration platform** designed to coordinate specialized AI agents through a structured workflow. The system combines a FastAPI backend, modern frontend, MongoDB, Redis, and ChromaDB to support agent execution, state management, persistence, and AI-powered task processing.

---

## 📌 Project Overview

The **Hackathon Multi-Agent Orchestrator** is designed to solve complex tasks by dividing them into smaller responsibilities handled by specialized AI agents.

Instead of relying on a single AI model for every operation, the orchestrator coordinates multiple agents and manages their execution through a defined workflow.

### Core Workflow

```text
User Request
     │
     ▼
Orchestrator
     │
     ├──► Agent 1
     │
     ├──► Agent 2
     │
     ├──► Agent 3
     │
     └──► Agent N
             │
             ▼
       Aggregation / Decision
             │
             ▼
        Final Response
```

The architecture is designed to make agent responsibilities explicit, execution observable, and the overall system easier to extend.

---

## ✨ Key Features

* 🤖 Multi-agent AI orchestration
* 🧩 Specialized agent-based task execution
* 🔄 Structured workflow and state management
* 🧠 AI-powered decision making
* 💾 MongoDB persistence
* ⚡ Redis-based supporting infrastructure
* 🔎 ChromaDB for vector-based functionality
* 🚀 FastAPI backend
* 🌐 Modern frontend application
* 🐳 Docker-based infrastructure
* 📊 Execution and system status visibility
* 🛡️ Error and failure handling
* 📝 Development checkpoints and project documentation

---

## 🏗️ Technology Stack

| Layer            | Technology              |
| ---------------- | ----------------------- |
| Frontend         | React / JavaScript      |
| Backend          | Python / FastAPI        |
| AI               | LLM / AI API            |
| Database         | MongoDB                 |
| Cache / Queue    | Redis                   |
| Vector Database  | ChromaDB                |
| API Server       | Uvicorn                 |
| Containerization | Docker / Docker Compose |
| Version Control  | Git / GitHub            |

---

## 📂 Project Documentation

Before making changes, developers should understand the project's existing documentation.

Read these files in order:

1. **`PROJECT_CONTEXT.md`** — project purpose, scope, technology stack, and important context
2. **`PROGRESS.md`** — current implementation status and active work
3. **`DECISIONS.md`** — finalized technical decisions
4. **`ARCHITECTURE.md`** — system architecture, graph structure, state shape, and endpoints

Additional project documentation may include:

* `DEPLOYMENT.md`
* `DEMO_SCRIPT.md`
* `FAILURE_LOG.md`

---

## 🚀 Quick Start

### Prerequisites

Make sure the following are installed:

* Git
* Docker
* Docker Compose
* Python 3.x
* Node.js
* npm

Verify your installations:

```bash
git --version
docker --version
docker compose version
python --version
node --version
npm --version
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/Pravinchavan321/Hackathon_Multi-Agent_Orchestrator.git
cd Hackathon_Multi-Agent_Orchestrator
```

---

## 2. Start Infrastructure Services

Start MongoDB, Redis, and ChromaDB using Docker Compose:

```bash
docker compose up -d
```

Check running containers:

```bash
docker compose ps
```

---

## 3. Configure Backend Environment

Navigate to the backend:

```bash
cd backend
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, if `cp` is unavailable:

```powershell
Copy-Item .env.example .env
```

Update `.env` with the required configuration.

At minimum, configure the required AI API key:

```env
AI_API_KEY=your_api_key_here
```

Do not commit `.env` or expose API keys publicly.

---

## 4. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

---

## 5. Start the FastAPI Backend

```bash
uvicorn main:app --reload --port 8080
```

The backend runs locally on:

```text
http://localhost:8080
```

FastAPI uses port **8080** locally because ChromaDB uses port **8000** in the current development configuration.

FastAPI's interactive API documentation is available at:

```text
http://localhost:8080/docs
```

---

## 6. Start the Frontend

Open another terminal from the project root:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The terminal will display the frontend development URL.

---

## 🔐 Environment Variables

Environment variables should be stored in the backend `.env` file.

Example:

```env
AI_API_KEY=your_api_key_here
```

Depending on the current implementation, additional variables may be required for:

* MongoDB
* Redis
* ChromaDB
* AI provider configuration
* Backend service configuration

Always check `.env.example` for the latest required variables.

### Security Rules

Never commit:

```text
.env
API keys
Passwords
Access tokens
Private credentials
Production secrets
```

---

## 🐳 Docker Services

The project uses Docker Compose for supporting infrastructure.

Start services:

```bash
docker compose up -d
```

Stop services:

```bash
docker compose down
```

View logs:

```bash
docker compose logs
```

View logs for a specific service:

```bash
docker compose logs <service-name>
```

Check service status:

```bash
docker compose ps
```

---

## 🧠 Multi-Agent Architecture

The orchestrator follows a structured agent execution model.

A typical execution flow is:

```text
                    ┌─────────────────┐
                    │   User Request  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Orchestrator  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Agent A  │   │ Agent B  │   │ Agent C  │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                   ┌─────────────────┐
                   │ Result / State  │
                   │   Aggregation   │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  Final Output   │
                   └─────────────────┘
```

The exact graph structure, state model, and agent responsibilities are documented in:

```text
ARCHITECTURE.md
```

---

## 🔄 Development Workflow

Before starting a new development session:

```text
PROJECT_CONTEXT.md
        ↓
PROGRESS.md
        ↓
DECISIONS.md
        ↓
ARCHITECTURE.md
```

Understand the current state before modifying the system.

### Recommended Git Workflow

Create a feature branch:

```bash
git checkout -b feature/<feature-name>
```

Make your changes, then inspect them:

```bash
git status
git diff
```

Stage the required files:

```bash
git add <files>
```

Create a meaningful commit:

```bash
git commit -m "feat: <description>"
```

Push the branch:

```bash
git push -u origin <branch-name>
```

Then create a Pull Request for review.

---

## 🧪 Testing and Validation

Before creating a Pull Request:

1. Verify the backend starts successfully.
2. Verify required Docker services are running.
3. Verify the frontend starts successfully.
4. Test affected API endpoints.
5. Test the relevant agent workflow.
6. Check error handling.
7. Review the Git diff.
8. Update project documentation when necessary.

Example:

```bash
git status
git diff
```

---

## 🛠️ Troubleshooting

### FastAPI Port Conflict

If port `8000` is already being used by ChromaDB, run FastAPI on port `8080`:

```bash
uvicorn main:app --reload --port 8080
```

### Docker Services Not Running

Check:

```bash
docker compose ps
```

Then inspect logs:

```bash
docker compose logs
```

### Backend Dependencies Missing

Run:

```bash
pip install -r requirements.txt
```

### Frontend Dependencies Missing

Run:

```bash
npm install
```

### Environment Configuration Problems

Verify that:

```text
backend/.env
```

exists and contains the required configuration from:

```text
backend/.env.example
```

---

## 📝 AI Coding Session Guidelines

When starting a new AI-assisted development session, provide the agent with the project's current context before making changes.

Recommended instruction:

> Read `PROJECT_CONTEXT.md`, `PROGRESS.md`, and `DECISIONS.md` before doing anything else. Then explain your understanding of the current project state before proceeding.

## After every work session
Update `PROGRESS.md` — move items from "In progress" to "Done", note any
blocker, and paste real command output into the checkpoint log section.
Commit to git. Do not end a session without both.


**Note:** FastAPI runs on port 8080 locally due to a port conflict with ChromaDB on port 8000.
