import React, { useEffect, useRef, useMemo, useState } from "react";

export function AIActivityTimeline({ threadId, events = [], streaming = false }) {
  const bottomRef = useRef(null);
  const [copied, setCopied] = useState(false);

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

  const handleCopyStream = () => {
    if (!streamedTokens) return;
    navigator.clipboard.writeText(streamedTokens);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!threadId) {
    return (
      <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 border border-gray-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 text-center flex flex-col items-center justify-center min-h-[320px] transition">
        <div className="w-14 h-14 rounded-2xl bg-gray-800/80 border border-gray-700/80 flex items-center justify-center text-gray-400 mb-3 shadow-inner">
          <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-200">Live Agent Execution Stream</h3>
        <p className="text-xs text-gray-400 max-w-sm mt-1.5 leading-relaxed">
          Submit an autonomous prompt above to watch real-time LangGraph node transitions, tool invocations, and vector queries.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 border border-gray-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/50 flex flex-col h-[500px] transition">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">
            Agent Execution Timeline
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {streaming ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/90 text-amber-300 border border-amber-500/40 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Streaming Live...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
              ✓ Completed
            </span>
          )}
          <span className="text-[11px] font-mono text-gray-400 bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-800 hidden sm:inline">
            ID: {threadId.slice(0, 12)}...
          </span>
        </div>
      </div>

      {/* Events Stream Container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-sans text-xs scrollbar-thin scrollbar-thumb-gray-700">
        {nonTokenEvents.length === 0 && !streamedTokens && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-xs italic gap-2">
            <svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Connecting to graph WebSocket execution stream...
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
                className="pl-3.5 pr-3 py-2 bg-blue-950/30 border-l-4 border-blue-500 rounded-r-xl text-gray-200 flex items-center justify-between shadow-sm animate-fadeIn"
              >
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">▶</span>
                  <span className="font-mono text-blue-200">
                    Node started: <strong className="text-blue-300 font-semibold">{nodeName || "Agent Node"}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">{evt.timestamp}</span>
              </div>
            );
          }

          if (type === "on_node_end" || type === "on_chain_end") {
            return (
              <div
                key={idx}
                className="pl-3.5 pr-3 py-2 bg-emerald-950/30 border-l-4 border-emerald-500 rounded-r-xl text-gray-200 flex items-center justify-between shadow-sm animate-fadeIn"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="font-mono text-emerald-200">
                    Node completed: <strong className="text-emerald-300 font-semibold">{nodeName || "Agent Node"}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">{evt.timestamp}</span>
              </div>
            );
          }

          if (type === "on_tool_start") {
            return (
              <div
                key={idx}
                className="pl-3.5 pr-3 py-2 bg-amber-950/30 border-l-4 border-amber-500 rounded-r-xl text-amber-200 flex items-center justify-between shadow-sm animate-fadeIn"
              >
                <div className="flex items-center gap-2">
                  <span>🔧</span>
                  <span className="font-mono text-amber-200">
                    Tool invoked: <strong className="text-amber-300 font-semibold">{toolName || "Vector Search"}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">{evt.timestamp}</span>
              </div>
            );
          }

          if (type === "on_tool_end") {
            return (
              <div
                key={idx}
                className="pl-3.5 pr-3 py-2 bg-amber-950/40 border-l-4 border-amber-400 rounded-r-xl text-amber-100 flex items-center justify-between shadow-sm animate-fadeIn"
              >
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span className="font-mono text-amber-200">
                    Tool completed: <strong className="text-amber-300 font-semibold">{toolName || "Tool Result"}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">{evt.timestamp}</span>
              </div>
            );
          }

          if (type === "done" || evt.type === "done") {
            return (
              <div
                key={idx}
                className="pl-3.5 pr-3 py-2.5 bg-gradient-to-r from-emerald-950/80 to-gray-900/80 border-l-4 border-emerald-400 rounded-r-xl text-emerald-200 font-bold flex items-center justify-between shadow-md animate-fadeIn"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🏁</span>
                  <span>Graph execution complete</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">{evt.timestamp}</span>
              </div>
            );
          }

          // Fallback custom event
          return (
            <details key={idx} className="pl-3 py-1.5 bg-gray-950/60 border-l-4 border-gray-700 rounded-r-lg text-gray-400 text-[11px]">
              <summary className="cursor-pointer font-mono hover:text-gray-200">
                Event: {type} {evt.timestamp && `(${evt.timestamp})`}
              </summary>
              <pre className="mt-1.5 p-2 bg-black/70 rounded-lg text-[10px] text-gray-300 overflow-x-auto">
                {JSON.stringify(evt, null, 2)}
              </pre>
            </details>
          );
        })}

        {/* Live LLM Stream Token Buffer */}
        {streamedTokens && (
          <div className="mt-3 p-3.5 bg-gray-950 border border-indigo-900/40 rounded-xl text-gray-200 shadow-inner">
            <div className="flex items-center justify-between text-xs text-indigo-400 font-medium mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span>LLM Structured Reasoning Stream:</span>
              </div>
              <button
                type="button"
                onClick={handleCopyStream}
                className="text-[10px] text-indigo-400 hover:text-indigo-200 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800 transition cursor-pointer"
              >
                {copied ? "Copied!" : "Copy Stream"}
              </button>
            </div>
            <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto text-gray-300 p-2 bg-black/50 rounded-lg border border-gray-800">
              {streamedTokens}
              {streaming && <span className="inline-block w-1.5 h-3.5 bg-indigo-400 ml-1 animate-pulse" />}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default AIActivityTimeline;
