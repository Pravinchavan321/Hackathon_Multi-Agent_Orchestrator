import asyncio
import uuid
from langchain_core.messages import HumanMessage

from backend.scripts.seed import seed_database
from backend.ai.tools.submission_tools import find_similar_submissions
from backend.ai.tools.team_tools import find_matching_participants
from backend.ai.agents.submission_agent import submission_agent_node
from backend.ai.agents.team_agent import team_agent_node


async def run_semantic_search_tests():
    print("=" * 75)
    print("  PHASE 6: CHROMADB TOOLS & SEMANTIC SEARCH VERIFICATION")
    print("=" * 75)

    # 1. Seed the database
    print("\n--- [CHECK 1: Database Seeding] ---")
    sub_count, part_count = seed_database()
    assert sub_count >= 15, "Should have seeded at least 15 submissions"
    assert part_count >= 10, "Should have seeded at least 10 participants"
    print("  [PASS] Seeding verified.")

    # 2. Semantic Submission Similarity Check (Paraphrased query with no exact keyword overlap)
    print("\n--- [CHECK 2: Semantic Similarity Search over Submissions] ---")
    query_description = (
        "A student revision assistant that digests university slide decks and notes, automatically "
        "generating practice quizzes, review flashcards, and exam preparation summaries."
    )
    print(f"  Search Query: \"{query_description}\"")
    similar_subs = find_similar_submissions.invoke({"description": query_description, "n_results": 3})

    print(f"  Top {len(similar_subs)} Semantic Matches:")
    top_titles = []
    for rank, sub in enumerate(similar_subs, 1):
        top_titles.append(sub["title"])
        print(f"    {rank}. '{sub['title']}' | Similarity Score: {sub['similarity_score']} | Distance: {sub['distance']}")
        print(f"       Description snippet: {sub['description'][:90]}...")

    expected_study_apps = {"StudyPal AI", "CogniLearn", "NoteGenius"}
    found_matches = set(top_titles).intersection(expected_study_apps)
    assert len(found_matches) > 0, (
        f"Expected at least one of {expected_study_apps} in top results, but got {top_titles}"
    )
    print(f"  [PASS] Semantic search succeeded! Detected related projects: {list(found_matches)} (without keyword match).")

    # 3. Semantic Participant Skill Matching Check
    print("\n--- [CHECK 3: Semantic Participant Skill Matching] ---")
    needed_skills = "We are seeking a frontend web developer skilled in React, TypeScript, and modern UI styling."
    print(f"  Requirement: \"{needed_skills}\"")
    matched_users = find_matching_participants.invoke({"needed_skills_description": needed_skills, "n_results": 3})

    print(f"  Top {len(matched_users)} Matched Participants:")
    matched_names = []
    for rank, user in enumerate(matched_users, 1):
        matched_names.append(user["name"])
        print(f"    {rank}. '{user['name']}' | Match Score: {user['similarity_score']} | Distance: {user['distance']}")
        print(f"       Bio: {user['skills_bio'][:90]}...")

    assert len(matched_users) > 0, "Expected at least 1 matched participant"
    assert "Alice Chen" in matched_names or "Grace Hopper-Liu" in matched_names, (
        f"Expected Alice Chen or Grace Hopper-Liu in top matches, got {matched_names}"
    )
    print(f"  [PASS] Participant matching succeeded! Top match: '{matched_users[0]['name']}'.")

    # 4. End-to-End Specialist Agent Node Execution with ChromaDB Tools
    print("\n--- [CHECK 4: Full Node Execution with Semantic Tools] ---")

    # Test Submission Agent Node End-to-End
    print("\n  [4A] Running Submission Agent Node End-to-End...")
    sub_state = {
        "messages": [
            HumanMessage(
                content=(
                    "Project Title: FlashRecall AI\n"
                    "Description: An intelligent education app that converts recorded classes and slide PDFs "
                    "into automated spaced repetition flashcard decks and practice tests for students."
                )
            )
        ],
        "task_type": "submission",
        "hackathon_id": None,
        "current_agent": "",
        "tool_results": {},
        "plan": None,
        "requires_human_approval": False,
        "final_result": None,
    }
    sub_node_result = await submission_agent_node(sub_state)
    sub_final = sub_node_result.get("final_result", {})

    print("    -> Submission Agent Final Structured Result:")
    print(f"         Summary: {sub_final.get('summary')}")
    print(f"         Innovation Score: {sub_final.get('innovation_score')}/10")
    print(f"         Technical Score: {sub_final.get('technical_score')}/10")
    print(f"         Completeness Score: {sub_final.get('completeness_score')}/10")
    print(f"         Novelty Assessment: {sub_final.get('novelty_assessment')}")
    print(f"         Similar Submissions Found ({len(sub_final.get('similar_submissions', []))} items):")
    for item in sub_final.get("similar_submissions", []):
        print(f"           - '{item.get('title')}' (Similarity: {item.get('similarity_score')})")

    assert sub_final.get("novelty_assessment") is not None, "novelty_assessment must be present"
    assert len(sub_final.get("similar_submissions", [])) > 0, "similar_submissions must be populated from ChromaDB"
    print("    [PASS] Submission agent node successfully incorporated ChromaDB prior art into novelty assessment.")

    # Test Team Agent Node End-to-End
    print("\n  [4B] Running Team Agent Node End-to-End...")
    team_state = {
        "messages": [
            HumanMessage(
                content=(
                    "We have a strong Solidity smart contract team building a DEX aggregator, "
                    "but we need a React and Next.js frontend engineer to build the decentralized trading UI."
                )
            )
        ],
        "task_type": "team",
        "hackathon_id": None,
        "current_agent": "",
        "tool_results": {},
        "plan": None,
        "requires_human_approval": False,
        "final_result": None,
    }
    team_node_result = await team_agent_node(team_state)
    team_final = team_node_result.get("final_result", {})

    print("    -> Team Agent Final Structured Result:")
    print(f"         Recommendation Summary: {team_final.get('recommendation_summary')}")
    print(f"         Missing Skills: {team_final.get('missing_skills')}")
    print(f"         Suggested Roles: {team_final.get('suggested_roles')}")
    print(f"         Compatibility Reasoning: {team_final.get('compatibility_reasoning')}")
    print(f"         Matched Participants ({len(team_final.get('matched_participants', []))} items):")
    for item in team_final.get("matched_participants", []):
        print(f"           - '{item.get('name')}' (Match Score: {item.get('similarity_score')})")

    assert len(team_final.get("matched_participants", [])) > 0, "matched_participants must be populated from ChromaDB"
    print("    [PASS] Team agent node successfully incorporated ChromaDB participant matches.")

    print("\n" + "=" * 75)
    print("  ALL 4 PHASE 6 SEMANTIC SEARCH & TOOL CHECKS PASSED SUCCESSFULLY!")
    print("=" * 75)
    await asyncio.sleep(0.5)


if __name__ == "__main__":
    asyncio.run(run_semantic_search_tests())
