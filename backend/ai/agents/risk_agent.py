from typing import Literal
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig

from backend.ai.llm import llm
from backend.ai.prompts.risk_prompt import RISK_SYSTEM_PROMPT
from backend.ai.graph.state import HackathonAgentState
from backend.core.logging import log


class RiskAnalysis(BaseModel):
    risk_level: Literal["LOW", "MEDIUM", "HIGH"] = Field(
        description="Assessed risk level: LOW, MEDIUM, or HIGH"
    )
    category: str = Field(
        description="Risk category (e.g. scoring_anomaly, plagiarism, vote_brigading, rule_violation, collusion)"
    )
    description: str = Field(
        description="Detailed description of the detected risk pattern or concern"
    )
    evidence: str = Field(
        description="Concrete evidence or indicators from the provided input"
    )


async def risk_agent_node(state: HackathonAgentState, config: RunnableConfig = None) -> dict:
    """
    Risk Agent Node:
    Audits hackathon events, voting patterns, and submissions for integrity risks.
    Flags requires_human_approval=True for HIGH risk levels.
    """
    thread_id = (config or {}).get("configurable", {}).get("thread_id", "")
    log.info(
        "Risk agent node entered",
        node="risk_agent",
        thread_id=thread_id,
        current_messages=len(state.get("messages", [])),
        task_type_in=state.get("task_type"),
    )

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
        user_content = "Evaluate general hackathon risk activity"

    prompt_messages = [
        SystemMessage(content=RISK_SYSTEM_PROMPT),
        HumanMessage(content=f"[USER_CONTENT]\n{user_content}\n[/USER_CONTENT]"),
    ]

    structured_llm = llm.with_structured_output(RiskAnalysis)
    analysis: RiskAnalysis = await structured_llm.ainvoke(prompt_messages, config=config)

    requires_approval = (analysis.risk_level == "HIGH")

    log.info(
        "Risk analysis completed",
        node="risk_agent",
        thread_id=thread_id,
        risk_level=analysis.risk_level,
        category=analysis.category,
        requires_approval=requires_approval,
    )


    ai_msg = AIMessage(
        content=f"Risk Assessment [{analysis.risk_level}]: {analysis.description} (Category: {analysis.category})"
    )

    return {
        "messages": [ai_msg],
        "current_agent": "risk_agent",
        "requires_human_approval": requires_approval,
        "final_result": analysis.model_dump(),
    }
