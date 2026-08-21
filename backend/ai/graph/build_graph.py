from langgraph.graph import StateGraph, END
from langgraph.checkpoint.mongodb import MongoDBSaver
from pymongo import MongoClient

from backend.ai.graph.state import HackathonAgentState
from backend.ai.agents.orchestrator_agent import orchestrator_node
from backend.ai.agents.submission_agent import submission_agent_node
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
    Build and compile the 2-node LangGraph with MongoDB checkpointing.
    Cached after first call so every request reuses the same graph instance.

    Phase 3 topology:
        START -> orchestrator -> submission_agent -> END
    """
    global _compiled_graph

    if _compiled_graph is not None:
        return _compiled_graph

    log.info("Building LangGraph (Phase 3: 2-node linear graph)...")

    builder = StateGraph(HackathonAgentState)

    # Add the two nodes
    builder.add_node("orchestrator", orchestrator_node)
    builder.add_node("submission_agent", submission_agent_node)

    # Linear edges: START -> orchestrator -> submission_agent -> END
    builder.set_entry_point("orchestrator")
    builder.add_edge("orchestrator", "submission_agent")
    builder.add_edge("submission_agent", END)

    # Compile with MongoDB checkpointer
    checkpointer = _build_checkpointer()
    _compiled_graph = builder.compile(checkpointer=checkpointer)

    log.info("LangGraph compiled successfully with MongoDBSaver checkpointer")
    return _compiled_graph
