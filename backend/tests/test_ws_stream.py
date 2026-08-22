"""
Phase 4 WebSocket streaming test.

Run with:  python -m backend.tests.test_ws_stream

Connects to ws://localhost:8080/ws/ai/tasks/ws-test-01, sends a message,
and logs each streaming event as it arrives in real-time.
"""

import asyncio
import json
import websockets


WS_URL = "ws://localhost:8080/ws/ai/tasks/ws-test-01"


async def main():
    print(f"\n{'='*60}")
    print(f"  Phase 4 WebSocket Streaming Test")
    print(f"{'='*60}")
    print(f"  Connecting to: {WS_URL} ...")

    try:
        async with websockets.connect(WS_URL) as ws:
            print("  [+] WebSocket connection established!")

            # Send input message
            payload = {"message": "Hello via websocket"}
            print(f"  [>] Sending: {json.dumps(payload)}")
            await ws.send(json.dumps(payload))

            print(f"\n{'='*60}")
            print("  STREAMING EVENTS (live):")
            print(f"{'='*60}\n")

            event_count = 0
            token_chunks = []
            got_done = False

            async for message in ws:
                event_count += 1
                try:
                    data = json.loads(message)
                except Exception:
                    print(f"  [raw] {message}")
                    continue

                event_type = data.get("event") or data.get("type", "unknown")
                node = data.get("node", "")

                if data.get("type") == "done":
                    got_done = True
                    print(f"\n  [DONE] Received final completion signal: {data}")
                    break

                if "chunk" in data:
                    token = data["chunk"]
                    token_chunks.append(token)
                    print(f"  [token chunk #{len(token_chunks)}] {repr(token)}")
                elif event_type in ("on_node_start", "on_chain_start"):
                    name = data.get("name", "")
                    print(f"  [--> START] {event_type} | node: {node} | name: {name}")
                elif event_type in ("on_node_end", "on_chain_end"):
                    name = data.get("name", "")
                    print(f"  [<-- END  ] {event_type} | node: {node} | name: {name}")
                else:
                    print(f"  [event] {data}")

            print(f"\n{'='*60}")
            print("  STREAMING VERIFICATION SUMMARY")
            print(f"{'='*60}")
            print(f"  Total events received: {event_count}")
            print(f"  Total token chunks streamed: {len(token_chunks)}")
            print(f"  Assembled text from tokens:\n  {''.join(token_chunks)}")
            print(f"{'='*60}")

            if got_done and len(token_chunks) > 0:
                print("  [PASS] WebSocket streaming is working incrementally in real-time!")
            else:
                print("  [WARN] Stream completed but expected token chunks or done signal was missing.")

            print(f"{'='*60}\n")

    except Exception as e:
        print(f"\n  [FAIL] Error during WebSocket test: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
