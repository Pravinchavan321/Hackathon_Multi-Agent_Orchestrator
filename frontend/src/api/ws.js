/**
 * WebSocket client helper for connecting to agent execution stream.
 */

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

/**
 * Creates and returns a WebSocket connection for a given orchestration thread ID.
 * @param {string} threadId - Unique orchestration thread ID.
 * @param {Object} callbacks - Event callbacks { onMessage, onError, onClose, onOpen }
 * @returns {WebSocket}
 */
export function createAgentWebSocket(threadId, callbacks = {}) {
  const { onMessage, onError, onClose, onOpen } = callbacks;
  const wsUrl = `${WS_BASE_URL}/ws/ai/tasks/${threadId}`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = (event) => {
    if (onOpen) onOpen(event);
    // Send default stream command
    try {
      ws.send(JSON.stringify({ message: "stream" }));
    } catch (err) {
      console.error("Failed to send initial WS message", err);
    }
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    } catch (err) {
      console.error("Failed to parse incoming WebSocket message", err);
    }
  };

  ws.onerror = (err) => {
    if (onError) onError(err);
  };

  ws.onclose = (event) => {
    if (onClose) onClose(event);
  };

  return ws;
}
