import json
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig

from backend.ai.llm import llm
from backend.ai.prompts.team_prompt import TEAM_SYSTEM_PROMPT
from backend.ai.tools.team_tools import find_matching_participants
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
    matched_participants: List[Dict[str, Any]] = Field(
        default_factory=list, description="Real matching participants retrieved from ChromaDB semantic search"
    )


async def team_agent_node(state: HackathonAgentState, config: RunnableConfig = None) -> dict:
    """
    Team Agent Node:
    1. Extracts teammate / skill gap request from state messages.
    2. Calls ChromaDB semantic search tool `find_matching_participants` to find candidate profiles.
    3. Prompts LLM with structured output to analyze skill gaps and produce structured recommendations.
    4. Updates state with structured final_result and tool_results.
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

    # Step 1: Execute semantic search tool over ChromaDB participant_skills
    try:
        matched_items = find_matching_participants.invoke({
            "needed_skills_description": user_content,
            "n_results": 3,
        })
    except Exception as e:
        log.error("Tool execution find_matching_participants failed", error=str(e))
        matched_items = []

    matched_summary = json.dumps(matched_items, indent=2) if matched_items else "No matching participant profiles found."

    # Step 2: LLM call with structured output incorporating tool results
    prompt_messages = [
        SystemMessage(content=TEAM_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"[USER_CONTENT]\n{user_content}\n[/USER_CONTENT]\n\n"
                f"[MATCHED_PARTICIPANTS]\n{matched_summary}\n[/MATCHED_PARTICIPANTS]"
            )
        ),
    ]

    structured_llm = llm.with_structured_output(TeamMatchRecommendation)
    recommendation: TeamMatchRecommendation = await structured_llm.ainvoke(prompt_messages, config=config)

    # Ensure the structured output contains the actual ChromaDB retrieval items
    rec_dict = recommendation.model_dump()
    if not rec_dict.get("matched_participants"):
        rec_dict["matched_participants"] = matched_items

    log.info(
        "Team recommendation completed with semantic matching",
        missing_skills_count=len(recommendation.missing_skills),
        suggested_roles=recommendation.suggested_roles,
        matched_count=len(matched_items),
    )

    ai_msg = AIMessage(
        content=(
            f"Team Recommendation: {recommendation.recommendation_summary} "
            f"(Needed: {', '.join(recommendation.missing_skills) if recommendation.missing_skills else 'None specified'}. "
            f"Matched {len(matched_items)} candidates from database.)"
        )
    )

    tool_results = state.get("tool_results", {}) or {}
    tool_results["matched_participants"] = matched_items

    return {
        "messages": [ai_msg],
        "current_agent": "team_agent",
        "tool_results": tool_results,
        "final_result": rec_dict,
    }

