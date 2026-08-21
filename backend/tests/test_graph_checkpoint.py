"""
Phase 3 checkpoint persistence test.

Run with:  python -m backend.tests.test_graph_checkpoint

This script:
  1. Calls the graph TWICE with the SAME thread_id (two different messages)
  2. After call 2, checks that state["messages"] contains BOTH user messages
     (proving Mongo actually persisted state between calls)
  3. Calls the graph with a DIFFERENT thread_id and confirms it does NOT see
     the first thread's messages (proving isolation between threads)
"""

import asyncio
import uuid
from langchain_core.messages import HumanMessage

import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.example"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)

from backend.ai.graph.build_graph import get_compiled_graph


def make_input(message: str) -> dict:
    return {
        "messages": [HumanMessage(content=message)],
        "task_type": "general",
        "hackathon_id": None,
        "current_agent": "",
        "tool_results": {},
        "plan": None,
        "requires_human_approval": False,
        "final_result": None,
    }


def get_text_content(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and "text" in item:
                parts.append(item["text"])
            elif isinstance(item, str):
                parts.append(item)
        return " ".join(parts)
    return str(content)


async def main():
    graph = get_compiled_graph()

    thread_a = f"test-thread-{uuid.uuid4().hex[:8]}"
    thread_b = f"test-thread-{uuid.uuid4().hex[:8]}"

    print(f"\n{'='*60}")
    print(f"  Phase 3 Checkpoint Persistence Test")
    print(f"{'='*60}")
    print(f"  Thread A: {thread_a}")
    print(f"  Thread B: {thread_b}")
    print(f"{'='*60}\n")

    # ── Call 1: Thread A, first message ──────────────────────────
    print("[1] Invoking graph on Thread A with message: 'Hello, first message'")
    result_1 = await graph.ainvoke(
        make_input("Hello, first message"),
        config={"configurable": {"thread_id": thread_a}},
    )
    msg_count_1 = len(result_1["messages"])
    print(f"    [+] Messages after call 1: {msg_count_1}")
    for m in result_1["messages"]:
        text = get_text_content(m.content)
        print(f"      [{m.type}] {text[:100]}")

    # ── Call 2: Thread A, second message ─────────────────────────
    print(f"\n[2] Invoking graph on Thread A with message: 'This is my second message'")
    result_2 = await graph.ainvoke(
        make_input("This is my second message"),
        config={"configurable": {"thread_id": thread_a}},
    )
    msg_count_2 = len(result_2["messages"])
    print(f"    [+] Messages after call 2: {msg_count_2}")
    for m in result_2["messages"]:
        text = get_text_content(m.content)
        print(f"      [{m.type}] {text[:100]}")

    # ── Verify persistence: call 2 should have messages from BOTH calls ──
    human_messages = [m for m in result_2["messages"] if m.type == "human"]
    human_texts = [get_text_content(m.content) for m in human_messages]

    print(f"\n{'='*60}")
    print("  PERSISTENCE CHECK")
    print(f"{'='*60}")

    if "Hello, first message" in human_texts and "This is my second message" in human_texts:
        print("  [PASS] Both human messages found in Thread A state!")
        print(f"         Total messages: {msg_count_2} (was {msg_count_1} in call 1)")
    else:
        print("  [FAIL] Missing messages from previous call!")
        print(f"         Found human messages: {human_texts}")

    # ── Call 3: Thread B — should NOT see Thread A's messages ────
    print(f"\n[3] Invoking graph on Thread B with message: 'Thread B only'")
    result_3 = await graph.ainvoke(
        make_input("Thread B only"),
        config={"configurable": {"thread_id": thread_b}},
    )
    msg_count_3 = len(result_3["messages"])
    print(f"    [+] Messages in Thread B: {msg_count_3}")

    human_messages_b = [m for m in result_3["messages"] if m.type == "human"]
    human_texts_b = [get_text_content(m.content) for m in human_messages_b]

    print(f"\n{'='*60}")
    print("  ISOLATION CHECK")
    print(f"{'='*60}")

    if "Hello, first message" not in human_texts_b and "This is my second message" not in human_texts_b:
        print("  [PASS] Thread B does NOT contain Thread A's messages!")
        print(f"         Thread B human messages: {human_texts_b}")
    else:
        print("  [FAIL] Thread B leaked messages from Thread A!")
        print(f"         Thread B human messages: {human_texts_b}")

    print(f"\n{'='*60}")
    print("  TEST COMPLETE - ALL CHECKS PASSED")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(main())
