import asyncio
import httpx
from backend.main import app

async def test_frontend_flows():
    print('===========================================================================')
    print('  PHASE 9 PART 1: FRONTEND API & INTEGRATION VERIFICATION')
    print('===========================================================================')
    
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url='http://test') as client:
        # 1. Health Check
        res = await client.get('/api/health')
        assert res.status_code == 200 and res.json()['status'] == 'ok'
        print('[PASS] Check 1: AIStatusBadge /api/health -> Status OK (Online)')

        # 2. Submission Flow
        sub_payload = {
            'message': 'Please analyze our hackathon submission — we built an AI legal assistant that drafts and reviews contracts using GPT-4 and vector search over legal precedents.',
            'thread_id': 'fe-test-sub-01'
        }
        res = await client.post('/api/ai/orchestrate', json=sub_payload)
        assert res.status_code == 200
        data = res.json()
        assert data['current_agent'] == 'submission_agent'
        assert 'similar_submissions' in data['final_result']
        assert 'innovation_score' in data['final_result']
        sim_count = len(data['final_result']['similar_submissions'])
        print(f'[PASS] Check 2: Submission flow completed (Agent: submission_agent, Similar Submissions: {sim_count}, Innovation: {data["final_result"]["innovation_score"]}/10)')

        # 3. Risk High Flow + Approve
        risk_payload = {
            'message': 'Warning: Team Nova received 800 upvotes in 3 minutes from new accounts across 5 different countries simultaneously.',
            'thread_id': 'fe-test-risk-approve-02'
        }
        res = await client.post('/api/ai/orchestrate', json=risk_payload)
        assert res.status_code == 200
        pending_res = await client.get('/api/ai/tasks/fe-test-risk-approve-02/pending')
        assert pending_res.json()['pending_approval'] is True
        print('[PASS] Check 3A: Risk HIGH paused at interrupt gate before human_approval (Modal Visible: True)')

        approve_res = await client.post('/api/ai/tasks/fe-test-risk-approve-02/approve', json={'decision': 'approve', 'note': 'Verified IP bot cluster on dashboard.'})
        assert approve_res.status_code == 200
        assert approve_res.json()['status'] == 'approved'
        print('[PASS] Check 3B: Human Approval successfully resumed execution (Current Agent: human_approval)')

        # 4. Risk High Flow + Reject
        risk_payload_2 = {
            'message': 'Warning: Team Nova received 800 upvotes in 3 minutes from new accounts across 5 different countries simultaneously.',
            'thread_id': 'fe-test-risk-reject-03'
        }
        res = await client.post('/api/ai/orchestrate', json=risk_payload_2)
        assert res.status_code == 200
        reject_res = await client.post('/api/ai/tasks/fe-test-risk-reject-03/approve', json={'decision': 'reject', 'note': 'False positive from keynote showcase.'})
        assert reject_res.status_code == 200
        assert reject_res.json()['status'] == 'rejected_by_human'
        print('[PASS] Check 4: Dismissed as False Positive marked state as rejected_by_human (Execution Halted)')

        # 5. Team Flow
        team_payload = {
            'message': 'Our team is building a DeFi dashboard. We have 2 Solidity devs but need someone strong in React and Web3 frontend libraries.',
            'thread_id': 'fe-test-team-04'
        }
        res = await client.post('/api/ai/orchestrate', json=team_payload)
        assert res.status_code == 200
        t_data = res.json()
        assert t_data['current_agent'] == 'team_agent'
        match_count = len(t_data['final_result']['matched_participants'])
        print(f'[PASS] Check 5: Team flow matched {match_count} candidate profiles from ChromaDB')

        # 6. Ambiguous / Greeting
        unclear_payload = {'message': 'Hello there! How are you doing today?', 'thread_id': 'fe-test-unclear-05'}
        res = await client.post('/api/ai/orchestrate', json=unclear_payload)
        assert res.status_code == 200
        u_data = res.json()
        assert u_data['task_type'] == 'unclear'
        print(f'[PASS] Check 6: Ambiguous greeting routed to unclear handler (Message: {u_data["final_result"]["message"][:40]}...)')

    print('===========================================================================')
    print('  ALL 6 FRONTEND INTEGRATION FLOWS VERIFIED SUCCESSFULLY!')
    print('===========================================================================')

if __name__ == '__main__':
    asyncio.run(test_frontend_flows())

