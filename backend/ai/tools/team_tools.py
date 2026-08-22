"""
Team Matching Tools.
Integrates ChromaDB semantic search for participant skill matching and team gap analysis.
"""

from langchain_core.tools import tool
from backend.db.chroma_client import get_or_create_collections
from backend.core.logging import log


@tool
def index_participant_skills(user_id: str, name: str, skills_bio: str) -> str:
    """
    Indexes a hackathon participant's skill bio and experience into the ChromaDB vector database.
    Use this tool to add or update participant profiles so they can be matched with teams.

    Args:
        user_id: Unique string identifier for the participant/user.
        name: The participant's full name or handle.
        skills_bio: Description of technical skills, frameworks, domains, and experience.

    Returns:
        Confirmation message indicating successful indexing.
    """
    try:
        _, participant_skills_col = get_or_create_collections()
        document_text = f"Name: {name}\nSkills & Experience: {skills_bio}"
        participant_skills_col.upsert(
            ids=[user_id],
            documents=[document_text],
            metadatas=[{"user_id": user_id, "name": name, "raw_bio": skills_bio}],
        )
        log.info("Indexed participant skills into ChromaDB", user_id=user_id, name=name)
        return f"Successfully indexed participant '{name}' (ID: {user_id})."
    except Exception as e:
        log.error("Failed to index participant skills", error=str(e), user_id=user_id)
        return f"Error indexing participant {user_id}: {str(e)}"


@tool
def find_matching_participants(needed_skills_description: str, n_results: int = 5) -> list[dict]:
    """
    Performs semantic vector similarity search over participant skill bios in ChromaDB.
    Use this tool to find potential teammates, mentors, or collaborators whose experience and skills
    best match a team's identified skill gaps or requirements (e.g. 'Looking for a React developer with UI/UX experience').

    This tool uses dense semantic embeddings, meaning it understands skill synonyms and related technologies
    (e.g., matching 'Solidity developer' to requests for 'smart contract engineer').

    Args:
        needed_skills_description: Natural language description of required skills or roles.
        n_results: Maximum number of candidate matches to return (default: 5).

    Returns:
        List of matched participant dicts:
        - user_id (str): Unique identifier of the participant
        - name (str): Participant's name
        - similarity_score (float): Normalized score between 0.0 and 1.0 (higher = better match)
        - distance (float): Vector space distance
        - skills_bio (str): The participant's skill profile and background
    """
    log.info(
        "Tool called: find_matching_participants",
        tool="find_matching_participants",
        query_length=len(needed_skills_description),
        n_results=n_results,
    )
    try:
        _, participant_skills_col = get_or_create_collections()
        count = participant_skills_col.count()
        if count == 0:
            log.info("No participant skills currently indexed in ChromaDB", tool="find_matching_participants")
            return []

        actual_k = min(n_results, count)
        results = participant_skills_col.query(
            query_texts=[needed_skills_description],
            n_results=actual_k,
            include=["metadatas", "distances", "documents"],
        )

        matched_participants: list[dict] = []
        ids = results.get("ids", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]
        documents = results.get("documents", [[]])[0]

        for idx in range(len(ids)):
            u_id = ids[idx]
            meta = metadatas[idx] if idx < len(metadatas) else {}
            dist = float(distances[idx]) if idx < len(distances) else 1.0
            doc = documents[idx] if idx < len(documents) else ""

            # Normalize distance to similarity score
            similarity_score = round(1.0 / (1.0 + max(0.0, dist)), 4)

            matched_participants.append({
                "user_id": u_id,
                "name": meta.get("name", "Unknown Participant"),
                "similarity_score": similarity_score,
                "distance": round(dist, 4),
                "skills_bio": meta.get("raw_bio", doc[:200]),
            })

        # Sort descending by match quality
        matched_participants.sort(key=lambda x: x["similarity_score"], reverse=True)
        log.info(
            "Tool completed: find_matching_participants",
            tool="find_matching_participants",
            query_len=len(needed_skills_description),
            matches_count=len(matched_participants),
            top_match=matched_participants[0]["name"] if matched_participants else None,
        )
        return matched_participants

    except Exception as e:
        log.error("Failed to query matching participants", tool="find_matching_participants", error=str(e))
        return []

