from typing import TypedDict, Annotated, Optional
from langgraph.graph.message import add_messages


class HackathonAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    task_type: str
    hackathon_id: Optional[str]
    current_agent: str
    tool_results: dict
    plan: Optional[list]
    requires_human_approval: bool
    final_result: Optional[dict]
