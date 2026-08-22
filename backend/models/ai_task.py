from datetime import datetime
from typing import Optional, Any
from beanie import Document
from pydantic import Field


class AITask(Document):
    """
    Tracks LangGraph orchestration tasks and human approval lifecycle.
    """
    thread_id: str = Field(..., description="Unique thread ID for LangGraph execution")
    task_type: str = Field(..., description="Classified task domain: submission, risk, team, general, unclear")
    prompt: str = Field(..., description="Original user prompt or query")
    status: str = Field(default="pending", description="Task status: pending, running, awaiting_approval, approved, rejected_by_human, completed, failed")
    current_agent: Optional[str] = Field(None, description="Current or final agent node executed")
    requires_human_approval: bool = Field(default=False, description="Flag if human approval gate was triggered")
    approval_decision: Optional[str] = Field(None, description="Human decision: approve or reject")
    approval_note: Optional[str] = Field(None, description="Reviewer feedback or explanation")
    final_result: Optional[dict[str, Any]] = Field(None, description="Final agent output payload")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ai_tasks"
