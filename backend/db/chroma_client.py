import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from backend.core.config import settings
from backend.core.logging import log

_client = None
_embedding_fn = None


def get_embedding_function():
    """
    Returns the local SentenceTransformer embedding function (all-MiniLM-L6-v2).
    Runs offline locally with zero API quota consumption and sub-millisecond inference.
    """
    global _embedding_fn
    if _embedding_fn is None:
        _embedding_fn = DefaultEmbeddingFunction()
    return _embedding_fn


def connect_chroma() -> chromadb.HttpClient:
    """Connect to ChromaDB server with heartbeat check and caching."""
    global _client
    if _client is not None:
        return _client

    try:
        log.info("Connecting to ChromaDB...", host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
        _client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            settings=ChromaSettings(allow_reset=True),
        )
        heartbeat = _client.heartbeat()
        log.info("Successfully connected to ChromaDB", heartbeat=heartbeat)
        return _client
    except Exception as e:
        log.error("Failed to connect to ChromaDB", error=str(e))
        raise


def get_or_create_collections(client: chromadb.HttpClient = None):
    """
    Ensures the two core semantic collections exist in ChromaDB:
    1. 'submissions': project submissions for novelty & similarity detection.
    2. 'participant_skills': participant skill bios for team matching.
    """
    if client is None:
        client = connect_chroma()

    ef = get_embedding_function()

    submissions_col = client.get_or_create_collection(
        name="submissions",
        embedding_function=ef,
        metadata={"description": "Hackathon project submissions for semantic similarity search"},
    )

    participant_skills_col = client.get_or_create_collection(
        name="participant_skills",
        embedding_function=ef,
        metadata={"description": "Participant skill bios for semantic team matching"},
    )

    log.info("ChromaDB collections verified/initialized", collections=["submissions", "participant_skills"])
    return submissions_col, participant_skills_col

