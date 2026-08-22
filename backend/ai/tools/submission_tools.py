"""
Submission Analysis Tools.
Integrates ChromaDB semantic search for project submission similarity and novelty assessment.
"""

from langchain_core.tools import tool
from backend.db.chroma_client import get_or_create_collections
from backend.core.logging import log


@tool
def index_submission(submission_id: str, title: str, description: str) -> str:
    """
    Indexes a hackathon project submission into the ChromaDB vector database.
    Use this tool to save a new or updated project submission so it can be semantically searched.

    Args:
        submission_id: Unique string identifier for the submission.
        title: The project title.
        description: Detailed project description and tech stack.

    Returns:
        Confirmation message indicating successful indexing.
    """
    try:
        submissions_col, _ = get_or_create_collections()
        # Combine title and description for richer semantic embeddings
        document_text = f"Title: {title}\nDescription: {description}"
        submissions_col.upsert(
            ids=[submission_id],
            documents=[document_text],
            metadatas=[{"submission_id": submission_id, "title": title, "raw_description": description}],
        )
        log.info("Indexed submission into ChromaDB", submission_id=submission_id, title=title)
        return f"Successfully indexed submission '{title}' (ID: {submission_id})."
    except Exception as e:
        log.error("Failed to index submission", error=str(e), submission_id=submission_id)
        return f"Error indexing submission {submission_id}: {str(e)}"


@tool
def find_similar_submissions(description: str, n_results: int = 5) -> list[dict]:
    """
    Performs semantic vector similarity search over existing hackathon project submissions.
    Use this tool to discover existing projects that share conceptual, algorithmic, or domain
    similarities with a given project description—even if they use completely different keywords or phrasing.

    This tool powers novelty evaluation and prior art checks by comparing dense embeddings in ChromaDB.

    Args:
        description: The project idea or submission description to search against.
        n_results: Maximum number of similar projects to retrieve (default: 5).

    Returns:
        List of matching submission dicts:
        - submission_id (str): Unique ID of the matched submission
        - title (str): Title of the project
        - similarity_score (float): Normalized similarity score between 0.0 and 1.0 (higher = more similar)
        - distance (float): Vector space cosine/L2 distance
        - description (str): Summary description of the existing submission
    """
    try:
        submissions_col, _ = get_or_create_collections()
        count = submissions_col.count()
        if count == 0:
            log.info("No submissions currently indexed in ChromaDB.")
            return []

        actual_k = min(n_results, count)
        results = submissions_col.query(
            query_texts=[description],
            n_results=actual_k,
            include=["metadatas", "distances", "documents"],
        )

        similar_items: list[dict] = []
        ids = results.get("ids", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]
        documents = results.get("documents", [[]])[0]

        for idx in range(len(ids)):
            sub_id = ids[idx]
            meta = metadatas[idx] if idx < len(metadatas) else {}
            dist = float(distances[idx]) if idx < len(distances) else 1.0
            doc = documents[idx] if idx < len(documents) else ""

            # Convert distance to normalized similarity score (for L2/squared distance, score = 1 / (1 + dist))
            similarity_score = round(1.0 / (1.0 + max(0.0, dist)), 4)

            similar_items.append({
                "submission_id": sub_id,
                "title": meta.get("title", "Untitled Project"),
                "similarity_score": similarity_score,
                "distance": round(dist, 4),
                "description": meta.get("raw_description", doc[:200]),
            })

        # Sort descending by similarity score
        similar_items.sort(key=lambda x: x["similarity_score"], reverse=True)
        log.info("Found similar submissions", query_len=len(description), matches_count=len(similar_items))
        return similar_items

    except Exception as e:
        log.error("Failed to query similar submissions", error=str(e))
        return []
