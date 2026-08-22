from typing import Literal
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig

from backend.ai.llm import llm
from backend.ai.prompts.orchestrator_prompt import ORCHESTRATOR_SYSTEM_PROMPT
from backend.ai.graph.state import HackathonAgentState
from backend.core.logging import log


class RouteDecision(BaseModel):
    task_type: Literal["submission", "risk", "team"] = Field(
        description="The target specialist agent: submission, risk, or team"
    )
    reasoning: str = Field(
        description="Detailed explanation for why this routing decision was chosen"
    )


async def orchestrator_node(state: HackathonAgentState, config: RunnableConfig = None) -> dict:
    """
    Orchestrator Node:
    Analyzes the user request using LLM structured output to decide the appropriate specialist agent.
    """
    log.info("Orchestrator node entered", current_messages=len(state.get("messages", [])))

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
        user_content = "Evaluate the general hackathon status"

    prompt_messages = [
        SystemMessage(content=ORCHESTRATOR_SYSTEM_PROMPT),
        HumanMessage(content=f"[USER_CONTENT]\n{user_content}\n[/USER_CONTENT]"),
    ]

    structured_llm = llm.with_structured_output(RouteDecision)
    decision: RouteDecision = await structured_llm.ainvoke(prompt_messages, config=config)

    log.info(
        "Orchestrator routing decision made",
        task_type=decision.task_type,
        reasoning=decision.reasoning,
    )

    ai_msg = AIMessage(
        content=f"Orchestrator routed to [{decision.task_type}]: {decision.reasoning}"
    )

    return {
        "messages": [ai_msg],
        "current_agent": "orchestrator",
        "task_type": decision.task_type,
        "plan": [{"step": 1, "agent": decision.task_type, "reasoning": decision.reasoning}],
    }
