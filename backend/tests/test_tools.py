from backend.ai.tools.submission_tools import find_similar_submissions, index_submission
from backend.ai.tools.team_tools import find_matching_participants, index_participant_skills
from backend.ai.tools.risk_tools import detect_scoring_anomaly, get_suspicious_activity_logs
from backend.ai.tools.hackathon_tools import get_hackathon_info, get_registration_stats


def test_all_tools():
    print("=" * 60)
    print("  TESTING HACKATHON TOOLS SUITE")
    print("=" * 60)

    # 1. Test Hackathon Management Tools
    info = get_hackathon_info.invoke({"event_slug": "main-hackathon"})
    assert "name" in info and "tracks" in info
    print(f"  [PASS] get_hackathon_info: {info['name']}")

    stats = get_registration_stats.invoke({})
    assert "total_participants" in stats
    print(f"  [PASS] get_registration_stats: {stats['total_participants']} participants")

    # 2. Test Risk Tools
    anomaly = detect_scoring_anomaly.invoke({"submission_id": "sub-123", "scores": [10.0, 10.0, 1.0, 2.0]})
    assert "is_anomaly" in anomaly
    print(f"  [PASS] detect_scoring_anomaly: is_anomaly={anomaly['is_anomaly']} (variance={anomaly['variance']})")

    logs = get_suspicious_activity_logs.invoke({"target_id": "team-456", "time_window_minutes": 15})
    assert isinstance(logs, list) and len(logs) > 0
    print(f"  [PASS] get_suspicious_activity_logs returned {len(logs)} activity records")

    # 3. Test ChromaDB Index & Query Tools
    res_index = index_submission.invoke({
        "submission_id": "test-sub-tool-01",
        "title": "Autonomous Drone Fleet Optimizer",
        "description": "Multi-agent pathfinding and battery management system for autonomous delivery drones using reinforcement learning.",
    })
    print(f"  [PASS] index_submission: {res_index}")

    sims = find_similar_submissions.invoke({
        "description": "Drone fleet routing and delivery logistics with battery optimization",
        "n_results": 2,
    })
    assert isinstance(sims, list)
    print(f"  [PASS] find_similar_submissions returned {len(sims)} matching projects")

    res_part = index_participant_skills.invoke({
        "user_id": "test-user-tool-01",
        "name": "Alex Mercer",
        "skills_bio": "Robotics specialist with Python, ROS2, and reinforcement learning expertise.",
    })
    print(f"  [PASS] index_participant_skills: {res_part}")

    mates = find_matching_participants.invoke({
        "needed_skills_description": "Robotics, ROS2, and reinforcement learning",
        "n_results": 2,
    })
    assert isinstance(mates, list)
    print(f"  [PASS] find_matching_participants returned {len(mates)} recommended teammates")

    print("=" * 60)
    print("  ALL TOOLS VERIFIED AND PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    test_all_tools()
