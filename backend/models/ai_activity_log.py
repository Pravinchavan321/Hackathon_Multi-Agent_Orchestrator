from datetime import datetime
from typing import Any
from beanie import Document
from pydantic import Field


class AIActivityLog(Document):
    """
    Log entry for agent activities and state transitions across the multi-agent graph.
    """
    thread_id: str = Field(..., description="Execution thread ID")
    agent_name: str = Field(..., description="Active agent node (e.g. orchestrator, submission_agent, risk_agent, team_agent)")
    event_type: str = Field(..., description="Type of event: node_start, node_end, tool_call, interrupt, approval")
    payload: dict[str, Any] = Field(default_factory=dict, description="Event metadata and data payload")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ai_activity_logs"
