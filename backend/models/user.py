from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class User(Document):
    """
    Participant / User document for hackathon participant tracking and skill indexing.
    """
    user_id: str = Field(..., description="Unique participant identifier")
    name: str = Field(..., description="Full name of participant")
    email: Optional[str] = Field(None, description="Contact email")
    skills: list[str] = Field(default_factory=list, description="Extracted tech skills")
    skills_bio: str = Field(..., description="Self-described skill summary and bio")
    role: str = Field(default="participant", description="Role in hackathon: participant, judge, organizer")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
