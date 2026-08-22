import React, { useState } from "react";
import { orchestrate } from "../api/aiAPI";

const EXAMPLE_PROMPTS = [
  {
    id: "sub",
    icon: "📄",
    label: "1. Submission Analysis",
    badge: "Submission Agent",
    badgeColor: "bg-blue-950 text-blue-300 border-blue-800/60",
    prompt:
      "Please analyze our hackathon submission — we built an AI legal assistant that drafts and reviews contracts using GPT-4 and vector search over legal precedents.",
  },
  {
    id: "risk",
    icon: "🛡️",
    label: "2. Anomaly / Risk Alert",
    badge: "Risk Agent (HITL)",
    badgeColor: "bg-rose-950 text-rose-300 border-rose-800/60",
    prompt:
      "Warning: Team Nova received 800 upvotes in 3 minutes from new accounts across 5 different countries simultaneously.",
  },
  {
    id: "team",
    icon: "👥",
    label: "3. Team Formation",
    badge: "Team Agent",
    badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-800/60",
    prompt:
      "Our team is building a DeFi dashboard. We have 2 Solidity devs but need someone strong in React and Web3 frontend libraries.",
  },
];

export function AIOrchestrator({ onTaskStarted, onReset }) {
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
          reasoning:
            planItem?.reasoning ||
            result.final_result?.reasoning ||
            "Routed to specialist agent based on detected intent and semantic context.",
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

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleRun(e);
    }
  };

  const handleClear = () => {
    setMessage("");
    setError(null);
    setRoutingDecision(null);
    if (onReset) onReset();
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/60 backdrop-blur-xl transition hover:border-slate-700/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20 animate-pulse" />
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-200">
            Autonomous Orchestrator Command
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-indigo-300 font-mono bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800/50">
            LangGraph StateGraph v2
          </span>
        </div>
      </div>

      {/* Quick Demo Scenarios Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium font-display tracking-wide">
            Select a Pre-configured Scenario or Enter Custom Goal:
          </span>
          {message && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition font-medium underline cursor-pointer"
            >
              Clear input
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {EXAMPLE_PROMPTS.map((ex) => {
            const isSelected = message === ex.prompt;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  setMessage(ex.prompt);
                  setError(null);
                }}
                disabled={loading}
                className={`text-left p-3.5 rounded-xl border text-xs transition-all duration-200 flex flex-col justify-between group cursor-pointer ${
                  isSelected
                    ? "bg-indigo-950/70 border-indigo-500 shadow-glow-indigo text-white"
                    : "bg-slate-950/70 hover:bg-slate-900/90 border-slate-800/90 hover:border-slate-700 text-slate-300 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-display font-semibold text-slate-100 flex items-center gap-1.5">
                    <span className="text-sm">{ex.icon}</span>
                    <span>{ex.label}</span>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-300 font-sans">
                  {ex.prompt}
                </span>
                <span className={`mt-2.5 inline-block self-start text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${ex.badgeColor}`}>
                  {ex.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Textarea */}
      <form onSubmit={handleRun}>
        <div className="relative">
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a hackathon goal, submit project details, report voting anomalies, or seek teammates..."
            disabled={loading}
            className="w-full bg-slate-950/90 border border-slate-800 focus:border-indigo-500 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-sans leading-relaxed transition shadow-inner"
          />
          <span className="absolute bottom-2.5 right-3 text-[10px] text-gray-500 select-none hidden sm:inline">
            Press <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300">Ctrl+Enter</kbd> to run
          </span>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-3 p-3 bg-rose-950/90 border border-rose-600/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-200 animate-fadeIn">
            <span className="text-rose-400 font-bold text-sm">⚠️</span>
            <div className="flex-1">
              <strong className="block text-rose-300">Orchestration Error:</strong>
              <span className="text-gray-300">{error}</span>
            </div>
          </div>
        )}

        {/* Action Button & Route Info */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <span className="text-gray-500">Autonomous routes:</span>
            <span className="text-blue-400 font-medium">Submission</span> •
            <span className="text-rose-400 font-medium">Risk</span> •
            <span className="text-emerald-400 font-medium">Team</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-950/60 active:scale-95 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Orchestrating...</span>
                </>
              ) : (
                <>
                  <span>Run Agent</span>
                  <span className="text-base leading-none">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Immediate Routing Decision Box */}
      {routingDecision && (
        <div className="mt-4 p-3.5 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-indigo-950/60 border border-indigo-500/40 rounded-xl animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>Orchestrator Routing Decision:</span>
            <span className="uppercase px-2 py-0.5 rounded-md bg-indigo-900/90 border border-indigo-600/60 text-indigo-100 font-mono text-[11px] font-bold">
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
