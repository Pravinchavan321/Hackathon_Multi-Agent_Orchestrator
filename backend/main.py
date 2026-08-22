import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env vars first
load_dotenv(os.path.join(os.path.dirname(__file__), ".env.example"))
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

from backend.core.logging import log
from backend.db.mongo import connect_mongo, close_mongo
from backend.db.redis_client import connect_redis, close_redis
from backend.db.chroma_client import connect_chroma, get_or_create_collections
from backend.routers import health_router, ai_router, ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await connect_mongo()
    except Exception as e:
        log.error("MongoDB startup failed, continuing without it.", error=str(e))
        
    try:
        await connect_redis()
    except Exception as e:
        log.error("Redis startup failed, continuing without it.", error=str(e))
        
    try:
        # Chroma is synchronous, connect and ensure collections exist
        client = connect_chroma()
        get_or_create_collections(client)
    except Exception as e:
        log.error("ChromaDB startup failed, continuing without it.", error=str(e))
        
    yield
    
    # Shutdown
    try:
        await close_mongo()
    except Exception as e:
        log.error("Error closing MongoDB.", error=str(e))
        
    try:
        await close_redis()
    except Exception as e:
        log.error("Error closing Redis.", error=str(e))

app = FastAPI(title="Hackathon Orchestrator API", lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(health_router.router)
app.include_router(ai_router.router)
app.include_router(ws_router.router)
