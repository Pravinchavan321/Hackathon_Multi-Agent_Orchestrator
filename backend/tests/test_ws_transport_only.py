"""
WebSocket Transport Lifecycle and Streaming Verification Test (No LLM required).

Connects to ws://localhost:8080/ws/ai/tasks/debug-thread-01, sends __PING_TEST__,
and measures elapsed time and gaps between received chunks to prove real-time
incremental transport streaming and clean connection closure.
"""

import asyncio
import json
import time
import websockets

WS_URL = "ws://localhost:8080/ws/ai/tasks/debug-thread-01"


async def main():
    print(f"\n{'='*70}")
    print("  PHASE 4: WebSocket Transport & Lifecycle Test (TEMP-DEBUG Ping)")
    print(f"{'='*70}")
    print(f"  Connecting to: {WS_URL} ...")

    start_time = None
    events = []
    gap_durations = []
    last_event_time = None
    got_done = False
    clean_close = False

    try:
        t0 = time.perf_counter()
        async with websockets.connect(WS_URL) as ws:
            conn_time = time.perf_counter() - t0
            print(f"  [+] Connected in {conn_time:.3f}s")

            # Send the test ping payload
            payload = {"message": "__PING_TEST__"}
            print(f"  [>] Sending: {json.dumps(payload)}\n")
            start_time = time.perf_counter()
            last_event_time = start_time
            await ws.send(json.dumps(payload))

            print(f"{'='*70}")
            print("  RECEIVED STREAM EVENTS (with relative timestamps & inter-frame gaps):")
            print(f"{'='*70}")

            async for message in ws:
                now = time.perf_counter()
                elapsed = now - start_time
                gap = now - last_event_time
                last_event_time = now

                try:
                    data = json.loads(message)
                except Exception:
                    data = {"raw": message}

                events.append(data)
                gap_durations.append(gap)

                if data.get("type") == "done":
                    got_done = True
                    print(f"  [{elapsed:6.2f}s] (+{gap:5.2f}s gap) [DONE] {data}")
                    break
                else:
                    print(f"  [{elapsed:6.2f}s] (+{gap:5.2f}s gap) [EVENT] {data}")

        clean_close = True

    except Exception as e:
        print(f"\n  [ERROR] Connection or transport error: {e}")
        import traceback
        traceback.print_exc()

    # Evaluation
    debug_events = [e for e in events if e.get("type") == "debug_event"]
    # Check that events 1 and 2 arrived ~1.0s after previous (allow tolerance 0.7s - 1.5s)
    # gap_durations[0] is from send to event 0 (~0.0s)
    # gap_durations[1] is between event 0 and 1 (~1.0s)
    # gap_durations[2] is between event 1 and 2 (~1.0s)
    streaming_gaps_ok = False
    if len(gap_durations) >= 3:
        gaps_between_chunks = gap_durations[1:3]
        streaming_gaps_ok = all(0.7 <= g <= 1.5 for g in gaps_between_chunks)

    print(f"\n{'='*70}")
    print("  VERIFICATION SUMMARY")
    print(f"{'='*70}")
    print(f"  - Total frames received: {len(events)}")
    print(f"  - Debug events received: {len(debug_events)} / 3 expected")
    print(f"  - Inter-event intervals: {[f'{g:.2f}s' for g in gap_durations]}")
    print(f"  - Incremental gaps verified (~1.0s each): {streaming_gaps_ok}")
    print(f"  - Done completion frame received: {got_done}")
    print(f"  - Clean websocket close: {clean_close}")
    print(f"{'='*70}")

    if len(debug_events) == 3 and streaming_gaps_ok and got_done and clean_close:
        print("  [PASS] WebSocket transport layer, streaming & lifecycle fully verified!")
        print(f"{'='*70}\n")
        return 0
    else:
        print("  [FAIL] WebSocket transport did not meet all verification criteria.")
        print(f"{'='*70}\n")
        return 1


if __name__ == "__main__":
    import sys
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
