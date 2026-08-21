from langchain_core.messages import AIMessage
from backend.ai.llm import llm
from backend.ai.graph.state import HackathonAgentState
from backend.core.logging import log


async def orchestrator_node(state: HackathonAgentState) -> dict:
    """
    Phase 3 stub: calls llm.ainvoke() on the last user message
    and returns the AI response. No routing logic yet (Phase 5).
    """
    log.info("Orchestrator node entered", current_messages=len(state.get("messages", [])))

    messages = state.get("messages", [])
    response = await llm.ainvoke(messages)

    log.info(
        "Orchestrator node completed",
        response_preview=response.content[:200] if response.content else "",
    )

    return {
        "messages": [response],
        "current_agent": "orchestrator",
        "task_type": state.get("task_type", "general"),
    }
