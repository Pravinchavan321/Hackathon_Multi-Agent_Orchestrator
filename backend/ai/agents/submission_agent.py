from typing import List
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig

from backend.ai.llm import llm
from backend.ai.prompts.submission_prompt import SUBMISSION_SYSTEM_PROMPT
from backend.ai.graph.state import HackathonAgentState
from backend.core.logging import log


class SubmissionAnalysis(BaseModel):
    innovation_score: float = Field(
        ge=0, le=10, description="Score between 0-10 evaluating novelty and creativity"
    )
    technical_score: float = Field(
        ge=0, le=10, description="Score between 0-10 evaluating technical depth and execution"
    )
    completeness_score: float = Field(
        ge=0, le=10, description="Score between 0-10 evaluating project completeness"
    )
    summary: str = Field(
        description="Concise summary of the analyzed project submission"
    )
    strengths: List[str] = Field(
        default_factory=list, description="Key technical and design strengths"
    )
    weaknesses: List[str] = Field(
        default_factory=list, description="Key areas of improvement or gaps"
    )


async def submission_agent_node(state: HackathonAgentState, config: RunnableConfig = None) -> dict:
    """
    Submission Agent Node:
    Analyzes project submission descriptions and outputs structured evaluation scores.
    """
    log.info("Submission agent node entered", current_messages=len(state.get("messages", [])))

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
        user_content = "Hackathon project submission details"

    prompt_messages = [
        SystemMessage(content=SUBMISSION_SYSTEM_PROMPT),
        HumanMessage(content=f"[USER_CONTENT]\n{user_content}\n[/USER_CONTENT]"),
    ]

    structured_llm = llm.with_structured_output(SubmissionAnalysis)
    analysis: SubmissionAnalysis = await structured_llm.ainvoke(prompt_messages, config=config)

    log.info(
        "Submission analysis completed",
        innovation=analysis.innovation_score,
        technical=analysis.technical_score,
        completeness=analysis.completeness_score,
    )

    ai_msg = AIMessage(
        content=f"Submission Analysis: {analysis.summary} (Scores: Innovation={analysis.innovation_score}/10, Technical={analysis.technical_score}/10, Completeness={analysis.completeness_score}/10)"
    )

    return {
        "messages": [ai_msg],
        "current_agent": "submission_agent",
        "final_result": analysis.model_dump(),
    }
