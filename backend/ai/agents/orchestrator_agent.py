from typing import Literal
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig

from backend.ai.llm import llm
from backend.ai.prompts.orchestrator_prompt import ORCHESTRATOR_SYSTEM_PROMPT
from backend.ai.graph.state import HackathonAgentState
from backend.core.logging import log


class RouteDecision(BaseModel):
    task_type: Literal["submission", "risk", "team", "unclear"] = Field(
        description="The target specialist agent: submission, risk, team, or unclear"
    )
    reasoning: str = Field(
        description="Detailed explanation for why this routing decision was chosen"
    )


async def orchestrator_node(state: HackathonAgentState, config: RunnableConfig = None) -> dict:
    """
    Orchestrator Node:
    Analyzes the user request using LLM structured output to decide the appropriate specialist agent.
    If the request is ambiguous or vague, routes to 'unclear' and stops execution.
    """
    thread_id = (config or {}).get("configurable", {}).get("thread_id", "")
    log.info(
        "Orchestrator node entered",
        node="orchestrator",
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
        user_content = "Evaluate the general hackathon status"

    prompt_messages = [
        SystemMessage(content=ORCHESTRATOR_SYSTEM_PROMPT),
        HumanMessage(content=f"[USER_CONTENT]\n{user_content}\n[/USER_CONTENT]"),
    ]

    structured_llm = llm.with_structured_output(RouteDecision)
    decision: RouteDecision = await structured_llm.ainvoke(prompt_messages, config=config)

    log.info(
        "Orchestrator routing decision made",
        node="orchestrator",
        thread_id=thread_id,
        task_type=decision.task_type,
        reasoning=decision.reasoning,
    )


    if decision.task_type == "unclear":
        ai_msg = AIMessage(
            content=f"Request unclear: {decision.reasoning}. Please clarify if you want to evaluate a submission, report/detect a risk, or find team members."
        )
        final_result = {
            "status": "unclear",
            "message": "Your request is too vague or does not match a specialist domain. Please clarify your goal.",
            "reasoning": decision.reasoning,
        }
    else:
        ai_msg = AIMessage(
            content=f"Orchestrator routed to [{decision.task_type}]: {decision.reasoning}"
        )
        final_result = None

    return {
        "messages": [ai_msg],
        "current_agent": "orchestrator",
        "task_type": decision.task_type,
        "plan": [{"step": 1, "agent": decision.task_type, "reasoning": decision.reasoning}],
        "final_result": final_result,
    }

