from typing import List
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig

from backend.ai.llm import llm
from backend.ai.prompts.team_prompt import TEAM_SYSTEM_PROMPT
from backend.ai.graph.state import HackathonAgentState
from backend.core.logging import log


class TeamMatchRecommendation(BaseModel):
    recommendation_summary: str = Field(
        description="Concise summary of the team matching recommendation"
    )
    missing_skills: List[str] = Field(
        default_factory=list, description="Key skills identified as missing or needed by the team"
    )
    suggested_roles: List[str] = Field(
        default_factory=list, description="Suggested roles to add to the team"
    )
    compatibility_reasoning: str = Field(
        description="Detailed explanation of skill compatibility and team composition needs"
    )


async def team_agent_node(state: HackathonAgentState, config: RunnableConfig = None) -> dict:
    """
    Team Agent Node:
    Analyzes skill gaps and teammate requests to produce structured team matching recommendations.
    """
    log.info("Team agent node entered", current_messages=len(state.get("messages", [])))

    messages = state.get("messages", [])
    user_content = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage) or (hasattr(msg, "type") and msg.type == "human"):
            user_content = msg.content if isinstance(msg.content, str) else str(msg.content)
            break
        elif isinstance(msg, dict) and msg.get("role") in ("user", "human"):
            user_content = str(msg.get("content", ""))
            break

    if not user_content:
        user_content = "Evaluate team matching and skill composition"

    prompt_messages = [
        SystemMessage(content=TEAM_SYSTEM_PROMPT),
        HumanMessage(content=f"[USER_CONTENT]\n{user_content}\n[/USER_CONTENT]"),
    ]

    structured_llm = llm.with_structured_output(TeamMatchRecommendation)
    recommendation: TeamMatchRecommendation = await structured_llm.ainvoke(prompt_messages, config=config)

    log.info(
        "Team recommendation completed",
        missing_skills_count=len(recommendation.missing_skills),
        suggested_roles=recommendation.suggested_roles,
    )

    ai_msg = AIMessage(
        content=f"Team Recommendation: {recommendation.recommendation_summary} (Needed: {', '.join(recommendation.missing_skills) if recommendation.missing_skills else 'None specified'})"
    )

    return {
        "messages": [ai_msg],
        "current_agent": "team_agent",
        "final_result": recommendation.model_dump(),
    }
