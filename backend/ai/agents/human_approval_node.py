"""
Human Approval Node (Interrupt Gate).
Acts as the interrupt_before gate for destructive risk actions in LangGraph.
When executed, indicates human approval has been explicitly granted via REST.
"""

from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig
from backend.ai.graph.state import HackathonAgentState
from backend.core.logging import log


async def human_approval_node(state: HackathonAgentState, config: RunnableConfig = None) -> dict:
    """
    Human Approval Node:
    The graph pauses BEFORE this node runs (via interrupt_before=['human_approval']).
    When this node actually executes, it means the human has approved and resumed the graph.
    """
    thread_id = (config or {}).get("configurable", {}).get("thread_id", "")
    log.info(
        "Human approval node executing (action resumed after human sign-off)",
        node="human_approval",
        thread_id=thread_id,
        current_agent="human_approval",
        task_type=state.get("task_type"),
    )


    ai_msg = AIMessage(
        content="Human approval verified. High-risk finding reviewed and approved for further action."
    )

    return {
        "messages": [ai_msg],
        "current_agent": "human_approval",
        "requires_human_approval": False,
    }
