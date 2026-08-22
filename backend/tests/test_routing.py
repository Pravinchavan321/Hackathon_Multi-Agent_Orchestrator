import asyncio
import uuid
from langchain_core.messages import HumanMessage

from backend.ai.graph.build_graph import get_compiled_graph

TEST_CASES = [
    {
        "name": "Submission Analysis Test",
        "expected_agent": "submission_agent",
        "expected_task_type": "submission",
        "message": (
            "Please review our hackathon project 'DeFi Guardian'. It is an automated risk analyzer "
            "for liquidity pools built with Solidity smart contracts and Next.js frontend. "
            "Please evaluate its technical complexity, innovation, and completeness score."
        ),
    },
    {
        "name": "Risk Detection Test",
        "expected_agent": "risk_agent",
        "expected_task_type": "risk",
        "message": (
            "Warning: We noticed an anomalous spike of 500 upvotes for Team Alpha within 2 minutes "
            "coming from brand-new IP addresses. Possible vote brigading or bot collusion detected!"
        ),
    },
    {
        "name": "Team Matching Test",
        "expected_agent": "team_agent",
        "expected_task_type": "team",
        "message": (
            "Our team is building an AI-powered legal assistant for the hackathon. We currently have "
            "2 backend Python developers, but we desperately need a Frontend React developer "
            "and someone with UI/UX design experience to join us."
        ),
    },
]


async def run_routing_tests():
    print("=" * 70)
    print("  PHASE 5: CONDITIONAL ROUTING AND SPECIALIST AGENT VERIFICATION")
    print("=" * 70)

    graph = get_compiled_graph()
    all_passed = True

    for idx, tc in enumerate(TEST_CASES, 1):
        thread_id = f"test-route-{uuid.uuid4().hex[:8]}"
        print(f"\n[{idx}] Running: {tc['name']}")
        print(f"    Message: \"{tc['message'][:80]}...\"")
        print(f"    Thread ID: {thread_id}")

        state_input = {
            "messages": [HumanMessage(content=tc["message"])],
            "task_type": "general",
            "hackathon_id": None,
            "current_agent": "",
            "tool_results": {},
            "plan": None,
            "requires_human_approval": False,
            "final_result": None,
        }

        try:
            result = await graph.ainvoke(
                state_input,
                config={"configurable": {"thread_id": thread_id}},
            )

            current_agent = result.get("current_agent")
            task_type = result.get("task_type")
            plan = result.get("plan")
            final_result = result.get("final_result")
            requires_human_approval = result.get("requires_human_approval", False)

            # Extract orchestrator reasoning from plan if present
            reasoning = ""
            if plan and len(plan) > 0:
                reasoning = plan[0].get("reasoning", "")

            print(f"    -> Orchestrator Task Type Decision : {task_type}")
            print(f"    -> Orchestrator Reasoning          : {reasoning}")
            print(f"    -> Landed at Agent Node            : {current_agent}")
            print(f"    -> Requires Human Approval         : {requires_human_approval}")
            print(f"    -> Agent Structured Final Result   :")
            for k, v in (final_result or {}).items():
                print(f"         {k}: {v}")

            # Check assertions
            assert current_agent == tc["expected_agent"], (
                f"Expected agent {tc['expected_agent']}, but got {current_agent}"
            )
            assert task_type == tc["expected_task_type"], (
                f"Expected task_type {tc['expected_task_type']}, but got {task_type}"
            )
            assert final_result is not None, "final_result should not be None"

            print(f"    [PASS] Successfully routed to {current_agent} with valid structured result.")

        except Exception as e:
            all_passed = False
            print(f"    [FAIL] Test failed with error: {e}")

    print("\n" + "=" * 70)
    if all_passed:
        print("  ALL 3 ROUTING TESTS PASSED SUCCESSFULLY!")
    else:
        print("  ROUTING TESTS FAILED - SEE ERRORS ABOVE")
    print("=" * 70)
    await asyncio.sleep(0.5)


if __name__ == "__main__":
    asyncio.run(run_routing_tests())

