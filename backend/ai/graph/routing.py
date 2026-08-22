"""
LangGraph Conditional Routing Logic.
"""

from backend.ai.graph.state import HackathonAgentState
from backend.core.logging import log


def route_to_agent(state: HackathonAgentState) -> str:
    """
    Conditional edge router:
    Directs flow from orchestrator to specialist node based on state["task_type"].
    """
    target = state.get("task_type", "submission")
    log.info("Conditional edge routing from orchestrator", router="route_to_agent", target_node=target)
    return target


def needs_approval(state: HackathonAgentState) -> str:
    """
    Conditional edge router for risk_agent:
    Checks if a high-risk finding requires human approval gate.
    """
    requires = state.get("requires_human_approval", False)
    target = "approval_required" if requires else "auto_complete"
    log.info("Conditional edge routing from risk_agent", router="needs_approval", requires_approval=requires, target_branch=target)
    return target



