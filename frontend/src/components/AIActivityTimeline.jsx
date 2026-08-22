import React, { useEffect, useRef, useMemo } from "react";

export function AIActivityTimeline({ threadId, events = [], streaming = false }) {
  const bottomRef = useRef(null);

  // Separate chat model stream tokens into a combined text buffer while preserving event list
  const { nonTokenEvents, streamedTokens } = useMemo(() => {
    const list = [];
    let tokens = "";

    events.forEach((evt) => {
      if (evt.eventType === "on_chat_model_stream" || evt.chunk) {
        tokens += evt.chunk || "";
      } else {
        list.push(evt);
      }
    });

    return { nonTokenEvents: list, streamedTokens: tokens };
  }, [events]);

  // Auto-scroll to bottom on update
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [events, streamedTokens]);

  if (!threadId) {
    return (
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-6 shadow-xl shadow-black/40 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center text-gray-500 mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-300">Live Agent Execution Stream</h3>
        <p className="text-xs text-gray-500 max-w-sm mt-1">
          Waiting for a task to start. Run an orchestrator prompt above to see real-time LangGraph node transitions and tool calls.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-xl shadow-black/40 flex flex-col h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-200">
            Live Agent Execution Timeline
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {streaming ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-500/30 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Agent running...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
              Idle / Finished
            </span>
          )}
          <span className="text-[11px] font-mono text-gray-500 bg-gray-950 px-2 py-0.5 rounded border border-gray-800">
            {threadId.slice(0, 16)}...
          </span>
        </div>
      </div>

      {/* Events Stream Container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-sans text-xs scrollbar-thin scrollbar-thumb-gray-700">
        {nonTokenEvents.length === 0 && !streamedTokens && (
          <div className="text-gray-500 text-xs italic py-4 text-center">
            Connecting to graph WebSocket stream...
          </div>
        )}

        {nonTokenEvents.map((evt, idx) => {
          const type = evt.eventType;
          const nodeName = evt.node || evt.name || "";
          const toolName = evt.tool || "";

          if (type === "on_node_start" || type === "on_chain_start") {
            return (
              <div
                key={idx}
                className="pl-3 py-1.5 bg-blue-950/30 border-l-2 border-blue-500 rounded-r text-gray-200 flex items-center justify-between"
              >
                <span className="font-mono text-blue-300">▶ Node started: <strong>{nodeName || "Agent Node"}</strong></span>
                <span className="text-[10px] text-gray-500 font-mono pr-2">{evt.timestamp}</span>
              </div>
            );
          }

          if (type === "on_node_end" || type === "on_chain_end") {
            return (
              <div
                key={idx}
                className="pl-3 py-1.5 bg-emerald-950/30 border-l-2 border-emerald-500 rounded-r text-gray-200 flex items-center justify-between"
              >
                <span className="font-mono text-emerald-300">✓ Node completed: <strong>{nodeName || "Agent Node"}</strong></span>
                <span className="text-[10px] text-gray-500 font-mono pr-2">{evt.timestamp}</span>
              </div>
            );
          }

          if (type === "on_tool_start") {
            return (
              <div
                key={idx}
                className="pl-3 py-1.5 bg-amber-950/30 border-l-2 border-amber-500 rounded-r text-amber-200 flex items-center justify-between"
              >
                <span className="font-mono text-amber-300">🔧 Tool called: <strong>{toolName || "Vector Search"}</strong></span>
                <span className="text-[10px] text-gray-500 font-mono pr-2">{evt.timestamp}</span>
              </div>
            );
          }

          if (type === "on_tool_end") {
            return (
              <div
                key={idx}
                className="pl-3 py-1.5 bg-amber-950/40 border-l-2 border-amber-400 rounded-r text-amber-100 flex items-center justify-between"
              >
                <span className="font-mono text-amber-300">✓ Tool returned: <strong>{toolName || "Tool"}</strong></span>
                <span className="text-[10px] text-gray-500 font-mono pr-2">{evt.timestamp}</span>
              </div>
            );
          }

          if (type === "done" || evt.type === "done") {
            return (
              <div
                key={idx}
                className="pl-3 py-2 bg-emerald-900/40 border-l-2 border-emerald-400 rounded-r text-emerald-200 font-bold flex items-center justify-between shadow-sm"
              >
                <span>✅ Graph execution complete</span>
                <span className="text-[10px] text-emerald-400 font-mono pr-2">{evt.timestamp}</span>
              </div>
            );
          }

          // Fallback unknown/custom event
          return (
            <details key={idx} className="pl-2 py-1 bg-gray-950/50 border-l-2 border-gray-700 rounded text-gray-400 text-[11px]">
              <summary className="cursor-pointer font-mono hover:text-gray-200">
                Event: {type} {evt.timestamp && `(${evt.timestamp})`}
              </summary>
              <pre className="mt-1 p-2 bg-black/60 rounded text-[10px] text-gray-300 overflow-x-auto">
                {JSON.stringify(evt, null, 2)}
              </pre>
            </details>
          );
        })}

        {/* Live LLM Stream Token Buffer */}
        {streamedTokens && (
          <div className="mt-2 p-3 bg-gray-950/90 border border-gray-800 rounded-lg text-gray-300">
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              LLM Thinking & Streaming...
            </div>
            <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
              {streamedTokens}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default AIActivityTimeline;
