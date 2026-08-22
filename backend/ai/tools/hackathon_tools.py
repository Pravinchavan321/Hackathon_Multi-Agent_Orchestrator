"""
Hackathon Management Tools.
Provides utilities for querying event timelines, rules, tracks, and participant registration statistics.
"""

from langchain_core.tools import tool
from backend.core.logging import log


@tool
def get_hackathon_info(event_slug: str = "main-hackathon") -> dict:
    """
    Retrieves hackathon event metadata including tracks, rules, schedule, and judging criteria.

    Args:
        event_slug: Slug or identifier of the hackathon event.

    Returns:
        Dictionary containing hackathon details:
        - name (str): Hackathon title
        - tracks (list[str]): Official prize tracks
        - max_team_size (int): Maximum participants per team
        - submission_deadline (str): Submission cutoff timestamp
    """
    log.info("Tool called: get_hackathon_info", tool="get_hackathon_info", event_slug=event_slug)
    return {
        "name": "Global Multi-Agent AI Hackathon 2026",
        "tracks": [
            "Autonomous Agents & Workflows",
            "Decentralized Systems & DeFi",
            "Developer Tooling & Infrastructure",
            "Healthcare & Social Good",
        ],
        "max_team_size": 4,
        "submission_deadline": "2026-08-25T23:59:59Z",
        "evaluation_criteria": [
            "Innovation & Novelty (35%)",
            "Technical Execution (35%)",
            "Completeness & User Experience (30%)",
        ],
    }


@tool
def get_registration_stats() -> dict:
    """
    Retrieves high-level participant registration and project submission metrics.

    Returns:
        Dictionary containing counts for active participants, teams, and submissions.
    """
    log.info("Tool called: get_registration_stats", tool="get_registration_stats")
    return {
        "total_participants": 248,
        "teams_formed": 62,
        "solo_hackers_looking_for_team": 34,
        "draft_submissions": 45,
        "final_submissions": 16,
    }
