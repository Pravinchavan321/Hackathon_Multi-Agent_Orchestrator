import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_core.messages import HumanMessage

from backend.ai.llm import llm, AIOfflineError
from backend.ai.graph.build_graph import get_compiled_graph
from backend.core.config import settings
from backend.core.logging import log

router = APIRouter(prefix="/api/ai", tags=["ai"])


# ── Phase 2: raw LLM ping ──────────────────────────────────────────

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
        raise HTTPException(status_code=503, detail={"status": "AI Engine Offline"})
    except Exception as e:
        log.error("Unexpected error in AI ping", error=str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ── Phase 3 & 5: orchestrate & graph-test endpoints ─────────────────

class OrchestrateRequest(BaseModel):
    goal: str = ""
    message: str = ""
    thread_id: str = ""
    hackathon_id: str | None = None

    def get_input_text(self) -> str:
        return self.goal or self.message or "Evaluate hackathon status"


@router.post("/orchestrate")
@router.post("/graph-test")
async def orchestrate(request: OrchestrateRequest):
    try:
        # Auto-generate a thread_id if not provided
        thread_id = request.thread_id or str(uuid.uuid4())
        input_text = request.get_input_text()

        log.info(
            "Graph orchestration requested",
            input_text=input_text,
            thread_id=thread_id,
        )

        graph = get_compiled_graph()

        # Invoke the graph with the user message and thread_id for checkpointing
        result = await graph.ainvoke(
            {
                "messages": [HumanMessage(content=input_text)],
                "task_type": "general",
                "hackathon_id": request.hackathon_id,
                "current_agent": "",
                "tool_results": {},
                "plan": None,
                "requires_human_approval": False,
                "final_result": None,
            },
            config={"configurable": {"thread_id": thread_id}},
        )

        # Serialize messages for JSON response
        serialized_messages = []
        for msg in result.get("messages", []):
            serialized_messages.append({
                "type": msg.type if hasattr(msg, "type") else "unknown",
                "content": msg.content if hasattr(msg, "content") else str(msg),
            })

        response = {
            "thread_id": thread_id,
            "task_type": result.get("task_type"),
            "current_agent": result.get("current_agent"),
            "requires_human_approval": result.get("requires_human_approval", False),
            "plan": result.get("plan"),
            "final_result": result.get("final_result"),
            "message_count": len(serialized_messages),
            "messages": serialized_messages,
        }

        log.info(
            "Graph orchestration completed",
            thread_id=thread_id,
            task_type=result.get("task_type"),
            current_agent=result.get("current_agent"),
            message_count=len(serialized_messages),
        )

        return response

    except AIOfflineError as e:
        log.warning("AI Engine Offline during orchestration", error=str(e))
        raise HTTPException(status_code=503, detail={"status": "AI Engine Offline"})
    except Exception as e:
        log.error("Unexpected error in orchestration", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

