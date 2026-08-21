import chromadb
from chromadb.config import Settings as ChromaSettings
from backend.core.config import settings
from backend.core.logging import log

def connect_chroma():
    try:
        log.info("Connecting to ChromaDB...", host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
        client = chromadb.HttpClient(
            host=settings.CHROMA_HOST, 
            port=settings.CHROMA_PORT,
            settings=ChromaSettings(allow_reset=True)
        )
        # Basic heartbeat check
        heartbeat = client.heartbeat()
        log.info("Successfully connected to ChromaDB", heartbeat=heartbeat)
        return client
    except Exception as e:
        log.error("Failed to connect to ChromaDB", error=str(e))
        raise
