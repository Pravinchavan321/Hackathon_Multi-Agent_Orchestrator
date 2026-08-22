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


def connect_chroma():
    """Connect to ChromaDB server with heartbeat check, caching, and local persistent fallback."""
    global _client
    if _client is not None:
        return _client

    chroma_host = getattr(settings, "CHROMA_HOST", "localhost")
    if chroma_host.lower() in ("embedded", "local_file", "none"):
        log.info("Initializing embedded ChromaDB PersistentClient (./chroma_data)...")
        _client = chromadb.PersistentClient(path="./chroma_data")
        return _client

    try:
        log.info("Connecting to ChromaDB HttpClient...", host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
        _client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            settings=ChromaSettings(allow_reset=True),
        )
        heartbeat = _client.heartbeat()
        log.info("Successfully connected to ChromaDB HttpClient", heartbeat=heartbeat)
        return _client
    except Exception as e:
        log.warn("ChromaDB HttpClient connection failed; falling back to embedded PersistentClient (./chroma_data)", error=str(e))
        try:
            _client = chromadb.PersistentClient(path="./chroma_data")
            log.info("Successfully initialized embedded ChromaDB PersistentClient")
            return _client
        except Exception as embed_err:
            log.error("Failed to initialize embedded ChromaDB", error=str(embed_err))
            raise e


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
    
    # Auto-seed if running on fresh instance (e.g. Render embedded Chroma)
    try:
        if submissions_col.count() == 0:
            log.info("ChromaDB submissions collection is empty; running automatic seed...")
            from backend.scripts.seed import seed_all
            seed_all()
    except Exception as e:
        log.warn("Automatic ChromaDB seeding skipped or encountered non-fatal error", error=str(e))

    return submissions_col, participant_skills_col


