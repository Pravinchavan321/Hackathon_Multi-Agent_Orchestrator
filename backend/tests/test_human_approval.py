import asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.ai.graph.build_graph import get_compiled_graph


async def run_human_approval_tests():
    print("=" * 75)
    print("  PHASE 7: HUMAN-IN-THE-LOOP INTERRUPT & APPROVAL VERIFICATION")
    print("=" * 75)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:

        # -------------------------------------------------------------
        # CHECK 1 & 2 & 3 & 4: High-Risk scenario -> PAUSE -> APPROVE
        # -------------------------------------------------------------
        print("\n--- [CHECK 1-4: High Risk Scenario -> Pause at Interrupt -> Human Approve] ---")
        thread_id_1 = f"test-approval-high-{uuid.uuid4().hex[:8]}"
        high_risk_message = (
            "Warning: We noticed an anomalous spike of 500 upvotes for Team Alpha within 2 minutes "
            "coming from brand-new IP addresses. Please review immediately for vote manipulation."
        )

        print(f"  [1] Starting orchestration on Thread ID: {thread_id_1}")
        start_res = await client.post(
            "/api/ai/orchestrate",
            json={"goal": high_risk_message, "thread_id": thread_id_1},
        )
        assert start_res.status_code == 200, f"Failed to start task: {start_res.text}"
        start_data = start_res.json()
        print(f"      Orchestrator routed to: {start_data.get('task_type')}")
        print(f"      Current agent reached : {start_data.get('current_agent')}")
        print(f"      requires_human_approval: {start_data.get('requires_human_approval')}")

        # [2] Check pending approval endpoint
        print("\n  [2] Checking GET /api/ai/tasks/{thread_id}/pending...")
        pending_res = await client.get(f"/api/ai/tasks/{thread_id_1}/pending")
        assert pending_res.status_code == 200, f"Pending check failed: {pending_res.text}"
        pending_data = pending_res.json()

        print(f"      pending_approval: {pending_data.get('pending_approval')}")
        print(f"      next in graph   : {pending_data.get('next')}")
        assert pending_data.get("pending_approval") is True, "Graph MUST be paused waiting for approval!"
        assert "human_approval" in pending_data.get("next", []), "'human_approval' node MUST be in next tuple!"
        print("      [PASS] Verified graph paused at interrupt gate before human_approval node.")

        # [3] Reviewer view of pending risk assessment
        print("\n  [3] Reviewing Pending Risk Assessment payload:")
        risk_payload = pending_data.get("final_result", {})
        print(f"      Risk Level : {risk_payload.get('risk_level')}")
        print(f"      Category   : {risk_payload.get('category')}")
        print(f"      Description: {risk_payload.get('description')}")
        print(f"      Evidence   : {risk_payload.get('evidence')}")
        assert risk_payload.get("risk_level") == "HIGH", "Risk level must be HIGH"

        # [4] Human Decision: Approve and Resume
        print("\n  [4] Submitting Human Approval (POST /api/ai/tasks/{thread_id}/approve with 'approve')...")
        approve_res = await client.post(
            f"/api/ai/tasks/{thread_id_1}/approve",
            json={"decision": "approve", "note": "Verified bot IP cluster on Grafana dashboard. Flag approved."},
        )
        assert approve_res.status_code == 200, f"Approve failed: {approve_res.text}"
        approve_data = approve_res.json()

        print(f"      Status       : {approve_data.get('status')}")
        print(f"      Decision     : {approve_data.get('decision')}")
        print(f"      Current Agent: {approve_data.get('current_agent')}")
        print(f"      Note         : {approve_data.get('note')}")
        assert approve_data.get("status") == "approved"
        assert approve_data.get("current_agent") == "human_approval"

        # Re-check pending state after approval
        pending_after_approve = await client.get(f"/api/ai/tasks/{thread_id_1}/pending")
        assert pending_after_approve.json().get("pending_approval") is False, "Task must no longer be pending after approval!"
        print("      [PASS] Graph resumed, completed execution, and is no longer pending.")

        # -------------------------------------------------------------
        # CHECK 5: High-Risk scenario -> PAUSE -> REJECT OVERRIDE
        # -------------------------------------------------------------
        print("\n--- [CHECK 5: High Risk Scenario -> Pause at Interrupt -> Human Reject Override] ---")
        thread_id_2 = f"test-approval-reject-{uuid.uuid4().hex[:8]}"
        print(f"  [5A] Starting orchestration on Thread ID: {thread_id_2}")
        start_res_2 = await client.post(
            "/api/ai/orchestrate",
            json={"goal": high_risk_message, "thread_id": thread_id_2},
        )
        assert start_res_2.status_code == 200

        # Verify it is paused
        pending_res_2 = await client.get(f"/api/ai/tasks/{thread_id_2}/pending")
        assert pending_res_2.json().get("pending_approval") is True

        # Human Decision: Reject
        print("  [5B] Submitting Human Rejection (POST /api/ai/tasks/{thread_id}/approve with 'reject')...")
        reject_res = await client.post(
            f"/api/ai/tasks/{thread_id_2}/approve",
            json={
                "decision": "reject",
                "note": "False positive: Spurt of votes was caused by an official in-person booth showcase.",
            },
        )
        assert reject_res.status_code == 200, f"Reject failed: {reject_res.text}"
        reject_data = reject_res.json()

        print(f"      Status       : {reject_data.get('status')}")
        print(f"      Decision     : {reject_data.get('decision')}")
        print(f"      Current Agent: {reject_data.get('current_agent')}")
        print(f"      Final Result : {reject_data.get('final_result')}")
        assert reject_data.get("status") == "rejected_by_human"
        assert reject_data.get("final_result", {}).get("status") == "rejected_by_human"

        # Re-check pending state after rejection
        pending_after_reject = await client.get(f"/api/ai/tasks/{thread_id_2}/pending")
        assert pending_after_reject.json().get("pending_approval") is False, "Task must no longer be pending after rejection!"
        print("      [PASS] Rejection correctly marked state as rejected_by_human and halted execution without resumption.")

        # -------------------------------------------------------------
        # CHECK 6: Non-Risk Scenario (Submission) -> NO PAUSE
        # -------------------------------------------------------------
        print("\n--- [CHECK 6: Non-Risk Scenario -> Immediate Auto-Completion (No Gate)] ---")
        thread_id_3 = f"test-approval-low-{uuid.uuid4().hex[:8]}"
        submission_message = (
            "Please review our hackathon project 'NoteGenius AI' which organizes lecture recordings "
            "into structured mindmaps and flashcards using NLP."
        )

        print(f"  [6A] Starting orchestration on Thread ID: {thread_id_3}")
        start_res_3 = await client.post(
            "/api/ai/orchestrate",
            json={"goal": submission_message, "thread_id": thread_id_3},
        )
        assert start_res_3.status_code == 200
        start_data_3 = start_res_3.json()

        print(f"      Orchestrator routed to: {start_data_3.get('task_type')}")
        print(f"      Current agent reached : {start_data_3.get('current_agent')}")
        print(f"      requires_human_approval: {start_data_3.get('requires_human_approval')}")

        pending_res_3 = await client.get(f"/api/ai/tasks/{thread_id_3}/pending")
        assert pending_res_3.status_code == 200
        pending_data_3 = pending_res_3.json()

        print(f"      pending_approval: {pending_data_3.get('pending_approval')}")
        print(f"      next in graph   : {pending_data_3.get('next')}")
        assert pending_data_3.get("pending_approval") is False, "Non-risk task must NOT be paused!"
        assert len(pending_data_3.get("next", [])) == 0, "Non-risk task must reach END immediately!"
        print("      [PASS] Non-risk task completed immediately with zero interrupt pause.")

    print("\n" + "=" * 75)
    print("  ALL 6 PHASE 7 HUMAN-IN-THE-LOOP APPROVAL CHECKS PASSED SUCCESSFULLY!")
    print("=" * 75)


if __name__ == "__main__":
    asyncio.run(run_human_approval_tests())
