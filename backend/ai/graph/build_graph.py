from langgraph.graph import StateGraph, END
from langgraph.checkpoint.mongodb import MongoDBSaver
from pymongo import MongoClient

from backend.ai.graph.state import HackathonAgentState
from backend.ai.graph.routing import route_to_agent
from backend.ai.agents.orchestrator_agent import orchestrator_node
from backend.ai.agents.submission_agent import submission_agent_node
from backend.ai.agents.risk_agent import risk_agent_node
from backend.ai.agents.team_agent import team_agent_node
from backend.core.config import settings
from backend.core.logging import log


# Module-level cache so we don't rebuild the graph on every request
_compiled_graph = None
_checkpointer = None


def _build_checkpointer():
    """Create a MongoDBSaver connected to our Mongo instance."""
    global _checkpointer
    if _checkpointer is None:
        log.info(
            "Creating MongoDBSaver checkpointer",
            uri=settings.MONGO_URI,
            db=settings.MONGO_DB_NAME,
        )
        client = MongoClient(settings.MONGO_URI)
        _checkpointer = MongoDBSaver(client, db_name=settings.MONGO_DB_NAME)
    return _checkpointer


def get_compiled_graph():
    """
    Build and compile the multi-agent LangGraph with conditional routing and MongoDB checkpointing.
    Cached after first call so every request reuses the same graph instance.

    Phase 5 topology:
        START -> orchestrator
                     |---> (conditional: 'submission') -> submission_agent -> END
                     |---> (conditional: 'risk')       -> risk_agent       -> END
                     |---> (conditional: 'team')       -> team_agent       -> END
    """
    global _compiled_graph

    if _compiled_graph is not None:
        return _compiled_graph

    log.info("Building LangGraph (Phase 5: Multi-Agent conditional routing graph)...")

    builder = StateGraph(HackathonAgentState)

    # Add agent nodes
    builder.add_node("orchestrator", orchestrator_node)
    builder.add_node("submission_agent", submission_agent_node)
    builder.add_node("risk_agent", risk_agent_node)
    builder.add_node("team_agent", team_agent_node)

    # Entry point is the master orchestrator
    builder.set_entry_point("orchestrator")

    # Conditional routing from orchestrator to specialist agents
    builder.add_conditional_edges(
        "orchestrator",
        route_to_agent,
        {
            "submission": "submission_agent",
            "risk": "risk_agent",
            "team": "team_agent",
        },
    )

    # Specialist agents complete their tasks and transition to END
    builder.add_edge("submission_agent", END)
    builder.add_edge("risk_agent", END)
    builder.add_edge("team_agent", END)

    # Compile with MongoDB checkpointer
    checkpointer = _build_checkpointer()
    _compiled_graph = builder.compile(checkpointer=checkpointer)

    log.info("LangGraph compiled successfully with MongoDBSaver checkpointer")
    return _compiled_graph

