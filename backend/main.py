import os
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import structlog

# Load env vars first
load_dotenv(os.path.join(os.path.dirname(__file__), ".env.example"))
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

from backend.core.config import settings
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

# Request correlation ID middleware
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or f"req-{uuid.uuid4().hex[:8]}"
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=req_id)
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    return response

# CORS configuration supporting development and production deployments
origins_raw = getattr(settings, "CORS_ORIGINS", "*")
if origins_raw == "*" or not origins_raw:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    allowed_origins = [orig.strip() for orig in origins_raw.split(",") if orig.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Mount routers
app.include_router(health_router.router)
app.include_router(ai_router.router)
app.include_router(ws_router.router)

