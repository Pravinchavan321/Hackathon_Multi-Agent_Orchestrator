from langchain_core.messages import AIMessage
from backend.ai.graph.state import HackathonAgentState
from backend.core.logging import log


async def submission_agent_node(state: HackathonAgentState) -> dict:
    """
    Phase 3 stub: just appends a fixed AI message acknowledging
    receipt and sets final_result. Real logic comes in Phase 5+.
    """
    log.info("Submission agent node entered")

    return {
        "messages": [AIMessage(content="Submission agent received the task.")],
        "current_agent": "submission_agent",
        "final_result": {"status": "stub complete"},
    }
