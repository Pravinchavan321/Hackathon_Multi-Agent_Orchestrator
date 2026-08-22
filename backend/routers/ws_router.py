import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from langchain_core.messages import HumanMessage

from backend.ai.graph.build_graph import get_compiled_graph
from backend.core.logging import log

router = APIRouter(tags=["websocket"])


def _extract_chunk_text(chunk) -> str:
    """Extract string content safely from a stream chunk."""
    if chunk is None:
        return ""
    if hasattr(chunk, "content"):
        content = chunk.content
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts = []
            for item in content:
                if isinstance(item, dict) and "text" in item:
                    parts.append(item["text"])
                elif isinstance(item, str):
                    parts.append(item)
            return "".join(parts)
    return str(chunk)


@router.websocket("/ws/ai/tasks/{thread_id}")
async def stream_agent_execution(websocket: WebSocket, thread_id: str):
    """
    WebSocket endpoint that streams live LangGraph execution events.

    1. Client connects and sends: {"message": "..."}
    2. Server invokes graph.astream_events(..., version="v2")
    3. Server pushes formatted JSON events (node transitions, token chunks)
    4. Server sends {"type": "done"} and closes connection cleanly
    """
    await websocket.accept()
    log.info("WebSocket connected", thread_id=thread_id)

    try:
        # 1. Receive the initial goal / prompt from client
        raw_data = await websocket.receive_text()
        data = json.loads(raw_data)
        user_message = data.get("message", "say hello")

        log.info("WebSocket message received", thread_id=thread_id, user_message=user_message)

        # 2. Get the compiled graph
        graph = get_compiled_graph()

        input_state = {
            "messages": [HumanMessage(content=user_message)],
            "task_type": "general",
            "hackathon_id": None,
            "current_agent": "",
            "tool_results": {},
            "plan": None,
            "requires_human_approval": False,
            "final_result": None,
        }
        config = {"configurable": {"thread_id": thread_id}}

        # 3. Stream events from LangGraph v2 streaming
        async for event in graph.astream_events(input_state, config=config, version="v2"):
            event_type = event.get("event", "")
            node_name = event.get("metadata", {}).get("langgraph_node", "")

            # Filter and structure payload
            payload = {
                "event": event_type,
                "node": node_name,
            }

            if event_type == "on_chat_model_stream":
                chunk = event.get("data", {}).get("chunk")
                token_text = _extract_chunk_text(chunk)
                if token_text:
                    payload["chunk"] = token_text
                    await websocket.send_json(payload)

            elif event_type in ("on_node_start", "on_chain_start"):
                payload["name"] = event.get("name", "")
                await websocket.send_json(payload)

            elif event_type in ("on_node_end", "on_chain_end"):
                payload["name"] = event.get("name", "")
                await websocket.send_json(payload)

            elif event_type == "on_tool_start":
                payload["tool"] = event.get("name", "")
                payload["input"] = event.get("data", {}).get("input")
                await websocket.send_json(payload)

            elif event_type == "on_tool_end":
                payload["tool"] = event.get("name", "")
                payload["output"] = str(event.get("data", {}).get("output", ""))
                await websocket.send_json(payload)

        # 4. Stream completed successfully
        log.info("WebSocket graph execution complete", thread_id=thread_id)
        await websocket.send_json({"type": "done"})
        await websocket.close()

    except WebSocketDisconnect:
        log.info("WebSocket disconnected by client", thread_id=thread_id)
    except Exception as e:
        log.error("WebSocket streaming error", thread_id=thread_id, error=str(e), exc_info=True)
        try:
            await websocket.send_json({"type": "error", "error": str(e)})
            await websocket.close(code=1011)
        except Exception:
            pass
