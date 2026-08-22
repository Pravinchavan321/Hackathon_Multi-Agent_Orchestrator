# Production Deployment Guide

This guide covers the fastest, zero-downtime deployment paths for the **Multi-Agent Hackathon Orchestrator**.

---

## ⚡ Option 1: Fast Free Cloud Deployment (Recommended)
Deploy Frontend on **Vercel** + Backend on **Render / Railway**.

### A. Deploy Backend on Render / Railway
1. **Repository**: Connect this GitHub repository.
2. **Environment**: Python 3.10.
3. **Build Command**: `pip install -r backend/requirements.txt`
4. **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables**:
   ```env
   # Mandatory:
   AI_API_KEY=your_gemini_api_key

   # Optional (Recommended for state persistence & vector storage):
   MONGO_URI=mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/hackathon_db?retryWrites=true&w=majority
   CHROMA_HOST=embedded
   CORS_ORIGINS=*

   # Optional (Redis is NOT required - runs in standalone mode if omitted):
   REDIS_URL=
   ```
   *(Note: Setting `CHROMA_HOST=embedded` uses SQLite persistence in `./chroma_data` with automatic startup seeding, meaning you don't need a separate vector server or Redis!).*

---

### B. Deploy Frontend on Vercel
1. Import repository on [Vercel Dashboard](https://vercel.com).
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite
4. **Environment Variables**:
   ```env
   VITE_API_URL=https://your-backend-app.onrender.com
   VITE_WS_URL=wss://your-backend-app.onrender.com
   ```
   *(Note: Use `wss://` for secure WebSocket connections on deployed HTTPS domains).*
5. Click **Deploy**. The included `vercel.json` ensures all routes reload seamlessly.

---

## 🐳 Option 2: 1-Command Full Stack Docker (DigitalOcean / AWS / VPS)

For single-server deployment:

1. Clone repository to your server:
   ```bash
   git clone https://github.com/Pravinchavan321/Hackathon_Multi-Agent_Orchestrator.git
   cd Hackathon_Multi-Agent_Orchestrator
   ```

2. Create your `.env` file with `AI_API_KEY`:
   ```bash
   echo "AI_API_KEY=your_key_here" >> .env
   ```

3. Launch everything (MongoDB, Redis, ChromaDB, Backend, Frontend + Nginx):
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. Seed the vector database with demo data:
   ```bash
   docker exec -it hackathon-backend-prod python -m backend.scripts.seed
   ```

5. Access the app:
   - Frontend UI: `http://<your-server-ip>`
   - Backend API: `http://<your-server-ip>:8080/docs`
   - Health Check: `http://<your-server-ip>:8080/api/health`

---

## 🛡️ Pre-Flight Verification & Safety Checks Implemented

| Potential Deployment Failure | Built-in Protection & Fix |
|------------------------------|---------------------------|
| **CORS blocking cross-origin frontend** | Configured dynamic regex CORS in `backend/main.py` allowing any frontend origin + credentials. |
| **Dynamic `$PORT` on PaaS** | Handled in `Procfile`, `backend/Dockerfile`, and `backend/core/config.py` (`0.0.0.0:${PORT:-8080}`). |
| **MongoDB Atlas `mongodb+srv://` SSL error** | Added `dnspython` and `certifi` to `backend/requirements.txt`. |
| **ChromaDB container not available** | Added auto-fallback in `backend/db/chroma_client.py` to local `PersistentClient(path="./chroma_data")`. |
| **Vite SPA 404 on page reload** | Added `frontend/vercel.json` and `frontend/public/_redirects` for automatic SPA fallback. |
| **LangSmith trace network drop** | Background async tracing with non-blocking error handling. |
