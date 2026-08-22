from datetime import datetime
from typing import Optional, Literal
from beanie import Document
from pydantic import Field


class AIRisk(Document):
    """
    Stores identified integrity risks, anomaly detections, and audit outcomes.
    """
    thread_id: str = Field(..., description="Orchestration thread ID")
    risk_level: Literal["LOW", "MEDIUM", "HIGH"] = Field(..., description="Severity level")
    category: str = Field(..., description="Risk category: scoring_anomaly, plagiarism, vote_brigading, rule_violation, collusion")
    description: str = Field(..., description="Detailed description of risk")
    evidence: str = Field(..., description="Evidence gathered by risk analysis agent")
    requires_human_approval: bool = Field(default=False)
    resolved: bool = Field(default=False)
    resolution_status: Optional[str] = Field(None, description="approved, rejected, dismissed")
    resolution_note: Optional[str] = Field(None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ai_risks"
