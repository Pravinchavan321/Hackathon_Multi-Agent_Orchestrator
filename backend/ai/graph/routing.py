"""
LangGraph Conditional Routing Logic.
"""

from backend.ai.graph.state import HackathonAgentState


def route_to_agent(state: HackathonAgentState) -> str:
    """
    Conditional edge router:
    Directs flow from orchestrator to specialist node based on state["task_type"].
    """
    return state.get("task_type", "submission")

