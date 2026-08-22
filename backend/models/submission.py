from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class Submission(Document):
    """
    Project Submission document for hackathon project tracking and semantic scoring.
    """
    submission_id: str = Field(..., description="Unique submission identifier")
    title: str = Field(..., description="Project title")
    description: str = Field(..., description="Project description and architecture summary")
    team_members: list[str] = Field(default_factory=list, description="List of participant user_ids")
    github_url: Optional[str] = Field(None, description="GitHub repository URL")
    demo_url: Optional[str] = Field(None, description="Live demo or video URL")
    innovation_score: Optional[float] = Field(None, description="AI evaluated innovation score (1-10)")
    technical_score: Optional[float] = Field(None, description="AI evaluated technical score (1-10)")
    completeness_score: Optional[float] = Field(None, description="AI evaluated completeness score (1-10)")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "submissions"
