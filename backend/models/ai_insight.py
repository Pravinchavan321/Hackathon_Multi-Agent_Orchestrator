from datetime import datetime
from typing import Optional, Any
from beanie import Document
from pydantic import Field


class AIInsight(Document):
    """
    Stores generated analytical insights from submission, team, or risk evaluations.
    """
    thread_id: str = Field(..., description="Associated orchestration thread ID")
    category: str = Field(..., description="Category of insight: submission_evaluation, team_recommendation, risk_flag")
    summary: str = Field(..., description="High-level insight summary")
    details: dict[str, Any] = Field(default_factory=dict, description="Structured evaluation details and scores")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ai_insights"
