"""
Risk Analysis Tools.
Provides utilities for detecting voting spikes, scoring anomalies, and suspicious activity patterns.
"""

from langchain_core.tools import tool
from backend.core.logging import log


@tool
def detect_scoring_anomaly(submission_id: str, scores: list[float]) -> dict:
    """
    Analyzes judge scores for a submission to detect statistical outliers, judge bias,
    or sudden anomalous scoring spikes.

    Args:
        submission_id: Unique identifier of the submission.
        scores: List of numeric scores awarded to the submission (1.0 - 10.0 scale).

    Returns:
        Dictionary with anomaly detection results:
        - is_anomaly (bool): True if high variance or extreme outlier detected
        - variance (float): Variance of the scores
        - mean (float): Average score
        - reason (str): Explanation of findings
    """
    log.info("Tool called: detect_scoring_anomaly", tool="detect_scoring_anomaly", submission_id=submission_id)
    if not scores:
        return {
            "is_anomaly": False,
            "mean": 0.0,
            "variance": 0.0,
            "reason": "No scores provided for evaluation.",
        }

    mean_score = sum(scores) / len(scores)
    variance = sum((x - mean_score) ** 2 for x in scores) / len(scores)

    # If variance > 8.0 (e.g., scores of 10, 10, 1, 1), flag as anomaly
    is_anomaly = variance > 8.0
    reason = "Score distribution normal." if not is_anomaly else f"High score divergence detected (variance={variance:.2f})."

    return {
        "is_anomaly": is_anomaly,
        "mean": round(mean_score, 2),
        "variance": round(variance, 2),
        "reason": reason,
    }


@tool
def get_suspicious_activity_logs(target_id: str, time_window_minutes: int = 15) -> list[dict]:
    """
    Retrieves recent telemetry logs and activity events flagged for potential vote brigading,
    rapid automated actions, or duplicate IP submissions.

    Args:
        target_id: Team ID or Submission ID to inspect.
        time_window_minutes: Evaluation window in minutes (default: 15).

    Returns:
        List of flagged suspicious activity log records.
    """
    log.info("Tool called: get_suspicious_activity_logs", tool="get_suspicious_activity_logs", target_id=target_id)
    # Simulated / cached suspicious telemetry check
    return [
        {
            "event": "rapid_vote_cluster",
            "target_id": target_id,
            "count": 120,
            "time_window_seconds": 60,
            "ip_range": "198.51.100.0/24",
            "severity": "HIGH",
        }
    ]
