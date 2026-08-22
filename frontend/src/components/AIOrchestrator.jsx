import React, { useState } from "react";
import { orchestrate } from "../api/aiAPI";

const EXAMPLE_PROMPTS = [
  {
    label: "1. Submission Analysis",
    type: "submission",
    prompt:
      "Please analyze our hackathon submission — we built an AI legal assistant that drafts and reviews contracts using GPT-4 and vector search over legal precedents.",
  },
  {
    label: "2. Anomaly / Risk Alert",
    type: "risk",
    prompt:
      "Warning: Team Nova received 800 upvotes in 3 minutes from new accounts across 5 different countries simultaneously.",
  },
  {
    label: "3. Team Formation",
    type: "team",
    prompt:
      "Our team is building a DeFi dashboard. We have 2 Solidity devs but need someone strong in React and Web3 frontend libraries.",
  },
];

export function AIOrchestrator({ onTaskStarted }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routingDecision, setRoutingDecision] = useState(null);

  const handleRun = async (e) => {
    e?.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    setError(null);
    setRoutingDecision(null);

    try {
      // Call REST orchestrate endpoint
      const result = await orchestrate(message.trim());
      
      const planItem = result?.plan?.[0];
      if (planItem || result?.task_type) {
        setRoutingDecision({
          task_type: result.task_type,
          reasoning: planItem?.reasoning || (result.final_result?.reasoning) || "Routed to specialist agent based on intent.",
        });
      }

      if (onTaskStarted) {
        onTaskStarted(result.thread_id, message.trim(), result);
      }
    } catch (err) {
      console.error("Orchestration error:", err);
      setError(err.message || "Failed to initiate agent orchestration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-xl shadow-black/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-200">
            Autonomous Orchestrator Input
          </h2>
        </div>
        <span className="text-xs text-gray-400 font-mono">LangGraph v2 • Multi-Agent</span>
      </div>

      {/* Examples Bar */}
      <div className="mb-3">
        <span className="text-xs text-gray-400 block mb-1.5 font-medium">Quick Demo Scenarios:</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {EXAMPLE_PROMPTS.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setMessage(ex.prompt);
                setError(null);
              }}
              disabled={loading}
              className="text-left px-2.5 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-xs text-gray-300 hover:text-white border border-gray-700/60 hover:border-indigo-500/50 transition duration-150 flex flex-col justify-between"
            >
              <span className="font-semibold text-indigo-300">{ex.label}</span>
              <span className="text-[11px] text-gray-400 truncate w-full mt-0.5">{ex.prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Textarea */}
      <form onSubmit={handleRun}>
        <div className="relative">
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a hackathon goal, submission description, risk anomaly, or teammate requirement..."
            disabled={loading}
            className="w-full bg-gray-950/80 border border-gray-700/80 focus:border-indigo-500 rounded-lg p-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
          />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-3 p-3 bg-rose-950/90 border border-rose-600/40 rounded-lg flex items-start gap-2 text-xs text-rose-200">
            <span className="text-rose-400 font-bold">Error:</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Routes to: <strong className="text-gray-400">Submission</strong>, <strong className="text-gray-400">Risk</strong>, or <strong className="text-gray-400">Team</strong> Agent
          </span>
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-medium transition shadow-md shadow-indigo-950/50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Orchestrating...
              </>
            ) : (
              <>
                <span>Run Agent</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Immediate Routing Decision Info Box */}
      {routingDecision && (
        <div className="mt-4 p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-lg animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Orchestrator Routing Decision:
            <span className="uppercase px-1.5 py-0.5 rounded bg-indigo-900/80 border border-indigo-700/50 text-indigo-200 font-mono">
              {routingDecision.task_type}
            </span>
          </div>
          <p className="text-xs text-gray-300 font-sans leading-relaxed">
            {routingDecision.reasoning}
          </p>
        </div>
      )}
    </div>
  );
}

export default AIOrchestrator;
