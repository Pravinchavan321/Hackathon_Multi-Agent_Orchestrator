import { useState, useEffect, useRef, useCallback } from "react";
import { getWsBaseUrl } from "../api/ws";

export function useAgentStream(threadId) {
  const [events, setEvents] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (!threadId) {
      setStreaming(false);
      return;
    }

    const wsBase = getWsBaseUrl();
    const wsUrl = `${wsBase}/ws/ai/tasks/${threadId}`;

    setStreaming(true);
    setError(null);
    clearEvents();

    let ws;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch (err) {
      console.error("WebSocket connection error:", err);
      setError(err.message || "Failed to establish WebSocket connection");
      setStreaming(false);
      return;
    }

    ws.onopen = () => {
      // Send initial trigger to stream execution
      try {
        ws.send(JSON.stringify({ message: "stream" }));
      } catch (err) {
        console.error("Failed to send initial WS message:", err);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const timestamp = new Date().toLocaleTimeString();

        // Check if stream is done
        if (data.type === "done") {
          setEvents((prev) => [...prev, { ...data, timestamp, eventType: "done" }]);
          setStreaming(false);
          return;
        }

        if (data.type === "error") {
          setError(data.error || "Agent streaming encountered an error");
          setEvents((prev) => [...prev, { ...data, timestamp, eventType: "error" }]);
          setStreaming(false);
          return;
        }

        // Store with classification and timestamp
        setEvents((prev) => [
          ...prev,
          {
            ...data,
            timestamp,
            eventType: data.event || data.type || "unknown",
          },
        ]);
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setError("WebSocket connection failed or interrupted.");
      setStreaming(false);
    };

    ws.onclose = () => {
      setStreaming(false);
    };

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [threadId, clearEvents]);

  return { events, streaming, error, clearEvents };
}

export default useAgentStream;
