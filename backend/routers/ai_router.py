from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.ai.llm import llm, AIOfflineError
from backend.core.config import settings
from backend.core.logging import log

router = APIRouter(prefix="/api/ai", tags=["ai"])

class PingRequest(BaseModel):
    message: str = "say hello"

@router.get("/ping")
async def ping_get():
    return await ping(PingRequest(message="say hello"))

@router.post("/ping")
async def ping(request: PingRequest):
    try:
        log.info("AI ping requested", message=request.message)
        
        response = await llm.ainvoke(request.message)
        response_text = response.content
        
        # Truncate response for logging to avoid huge lines
        log_text = response_text[:200] + "..." if len(response_text) > 200 else response_text
        log.info("AI ping response received", response=log_text)
        
        return {"response": response_text, "model": settings.AI_MODEL}
    except AIOfflineError as e:
        log.warning("AI Engine Offline during ping request", error=str(e))
        # Need to return custom dictionary as per instructions, but using HTTPException wrapper
        raise HTTPException(status_code=503, detail={"status": "AI Engine Offline"})
    except Exception as e:
        log.error("Unexpected error in AI ping", error=str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")
