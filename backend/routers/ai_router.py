import uuid
import structlog
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
    goal: str | None = None
    message: str | None = None
    thread_id: str | None = None
    hackathon_id: str | None = None

    def get_input_text(self) -> str:
        text = (self.goal or self.message or "").strip()
        return text if text else "Evaluate hackathon status"


@router.post("/orchestrate")
@router.post("/graph-test")
async def orchestrate(request: OrchestrateRequest):
    try:
        # Auto-generate a thread_id if not provided
        thread_id = request.thread_id or str(uuid.uuid4())
        structlog.contextvars.bind_contextvars(thread_id=thread_id)
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


# ── Phase 7: Human-in-the-Loop Interrupt & Approval Endpoints ───────

class ApproveRequest(BaseModel):
    decision: str = "approve"  # "approve" | "reject"
    note: str | None = ""


@router.get("/tasks/{thread_id}/pending")
async def get_pending_task(thread_id: str):
    """
    Checks if a given thread_id is currently paused at a human-in-the-loop interrupt gate.
    Returns the pending risk assessment and approval status.
    """
    structlog.contextvars.bind_contextvars(thread_id=thread_id)
    log.info("Task pending status query received", thread_id=thread_id)
    try:
        graph = get_compiled_graph()
        config = {"configurable": {"thread_id": thread_id}}
        state_snapshot = await graph.aget_state(config)

        if not state_snapshot or not state_snapshot.values:
            log.warning("Task thread not found in checkpoint store", thread_id=thread_id)
            raise HTTPException(status_code=404, detail=f"Task thread '{thread_id}' not found")

        is_pending = "human_approval" in (state_snapshot.next or ())

        log.info(
            "Task pending status evaluated",
            thread_id=thread_id,
            pending_approval=is_pending,
            next_nodes=list(state_snapshot.next or ()),
            current_agent=state_snapshot.values.get("current_agent"),
        )

        return {
            "thread_id": thread_id,
            "pending_approval": is_pending,
            "next": list(state_snapshot.next or ()),
            "final_result": state_snapshot.values.get("final_result"),
            "current_agent": state_snapshot.values.get("current_agent"),
            "requires_human_approval": state_snapshot.values.get("requires_human_approval", False),
        }
    except HTTPException:
        raise
    except Exception as e:
        log.error("Error retrieving task pending state", thread_id=thread_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/{thread_id}/approve")
async def approve_task(thread_id: str, request: ApproveRequest):
    """
    Handles a human-in-the-loop decision for an interrupted graph task.
    - 'approve': Resumes the graph from the interrupt point to complete execution.
    - 'reject': Overrides the state to mark as rejected and stops execution.
    """
    structlog.contextvars.bind_contextvars(thread_id=thread_id)
    try:
        if request.decision not in ("approve", "reject"):
            log.warning("Invalid approval decision value", thread_id=thread_id, decision=request.decision)
            raise HTTPException(status_code=400, detail="Decision must be 'approve' or 'reject'")

        graph = get_compiled_graph()
        config = {"configurable": {"thread_id": thread_id}}
        state_snapshot = await graph.aget_state(config)

        if not state_snapshot or not state_snapshot.values:
            log.warning("Task thread not found for approval", thread_id=thread_id)
            raise HTTPException(status_code=404, detail=f"Task thread '{thread_id}' not found")

        is_pending = "human_approval" in (state_snapshot.next or ())
        if not is_pending:
            log.warning("Attempted approval on non-pending task", thread_id=thread_id)

        log.info(
            "Human approval decision received",
            thread_id=thread_id,
            decision=request.decision,
            note=request.note,
        )

        if request.decision == "approve":
            # Resume execution from the interrupt point
            resumed_result = await graph.ainvoke(None, config=config)
            log.info(
                "Task graph successfully resumed after human approval",
                thread_id=thread_id,
                current_agent=resumed_result.get("current_agent", "human_approval"),
            )

            return {
                "thread_id": thread_id,
                "status": "approved",
                "decision": "approve",
                "note": request.note,
                "current_agent": resumed_result.get("current_agent", "human_approval"),
                "final_result": resumed_result.get("final_result"),
                "requires_human_approval": False,
            }
        else:
            # Reject: Override state without executing downstream destructive action
            original_risk = state_snapshot.values.get("final_result")
            override_result = {
                "status": "rejected_by_human",
                "decision": "reject",
                "note": request.note,
                "original_risk": original_risk,
            }
            await graph.aupdate_state(
                config,
                {
                    "final_result": override_result,
                    "requires_human_approval": False,
                    "current_agent": "human_approval_rejected",
                },
                as_node="human_approval",
            )
            log.info("Task marked as rejected by human override", thread_id=thread_id, note=request.note)

            return {
                "thread_id": thread_id,
                "status": "rejected_by_human",
                "decision": "reject",
                "note": request.note,
                "current_agent": "human_approval_rejected",
                "final_result": override_result,
                "requires_human_approval": False,
            }

    except HTTPException:
        raise
    except Exception as e:
        log.error("Error processing approval decision", thread_id=thread_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))



